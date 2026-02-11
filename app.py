import argparse
import csv
import re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable, Optional



@dataclass
class DocumentRecord:
    name: Optional[str]
    nrc_id_number: Optional[str]
    father_name: Optional[str]
    company_name: Optional[str]
    full_text: str


FIELD_PATTERNS = {
    "name": [
        r"(?:^|\n)\s*(?:name|full\s*name)\s*[:\-]\s*(.+)",
        r"(?:^|\n)\s*holder\s*name\s*[:\-]\s*(.+)",
    ],
    "nrc_id_number": [
        r"(?:^|\n)\s*(?:nrc\s*(?:id)?\s*(?:number|no\.?))\s*[:\-]\s*([A-Z0-9\-/()]+)",
        r"\b([0-9]{1,2}/[A-Za-z]{3}\([A-Za-z]\)[0-9]{6})\b",
    ],
    "father_name": [
        r"(?:^|\n)\s*(?:father(?:'s)?\s*name)\s*[:\-]\s*(.+)",
    ],
    "company_name": [
        r"(?:^|\n)\s*(?:company\s*name|organization|employer)\s*[:\-]\s*(.+)",
    ],
}


def clean_value(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    value = re.sub(r"\s+", " ", value).strip(" .:-\n\t")
    return value or None


def first_match(text: str, patterns: Iterable[str]) -> Optional[str]:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return clean_value(match.group(1))
    return None


def parse_document_fields(text: str) -> DocumentRecord:
    normalized_text = text.replace("\r", "\n")
    name = first_match(normalized_text, FIELD_PATTERNS["name"])
    nrc_id_number = first_match(normalized_text, FIELD_PATTERNS["nrc_id_number"])
    father_name = first_match(normalized_text, FIELD_PATTERNS["father_name"])
    company_name = first_match(normalized_text, FIELD_PATTERNS["company_name"])

    # Fallback for name if label-based extraction fails.
    if not name:
        lines = [clean_value(line) for line in normalized_text.splitlines()]
        candidate_lines = [line for line in lines if line and len(line.split()) >= 2]
        if candidate_lines:
            name = candidate_lines[0]

    return DocumentRecord(
        name=name,
        nrc_id_number=nrc_id_number,
        father_name=father_name,
        company_name=company_name,
        full_text=clean_value(normalized_text) or "",
    )


def extract_text_from_image(image_path: Path, lang: str = "eng") -> str:
    from PIL import Image
    import pytesseract

    image = Image.open(image_path)
    return pytesseract.image_to_string(image, lang=lang)


def process_images_to_csv(image_paths: list[Path], output_csv: Path, lang: str = "eng") -> None:
    rows = []
    for image_path in image_paths:
        text = extract_text_from_image(image_path=image_path, lang=lang)
        record = parse_document_fields(text)
        row = asdict(record)
        row["source_file"] = image_path.name
        rows.append(row)

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "source_file",
        "name",
        "nrc_id_number",
        "father_name",
        "company_name",
        "full_text",
    ]

    with output_csv.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def build_argument_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Extract OCR text from document photos and output structured columns to CSV."
    )
    parser.add_argument(
        "images",
        nargs="+",
        type=Path,
        help="Path(s) to image files (jpg/png) containing document text.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("output/extracted_data.csv"),
        help="CSV output path. Default: output/extracted_data.csv",
    )
    parser.add_argument(
        "--lang",
        default="eng",
        help="Tesseract language code. Default: eng",
    )
    return parser


def main() -> None:
    parser = build_argument_parser()
    args = parser.parse_args()

    missing = [str(path) for path in args.images if not path.exists()]
    if missing:
        parser.error(f"Image file(s) not found: {', '.join(missing)}")

    process_images_to_csv(image_paths=args.images, output_csv=args.output, lang=args.lang)
    print(f"Saved extracted data to {args.output}")


if __name__ == "__main__":
    main()
