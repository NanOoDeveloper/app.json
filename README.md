# Photo-to-Text Extraction App

This app reads document photos, extracts text using OCR, and exports one CSV row per image with these columns:

- `name`
- `nrc_id_number`
- `father_name`
- `company_name`
- `full_text` (all extracted text as one column)

It also includes a `source_file` column so you can trace each row to the original image.

## Requirements

- Python 3.10+
- Tesseract OCR engine installed on your system
- Python dependencies in `requirements.txt`

Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run OCR on one or more images:

```bash
python app.py path/to/doc1.jpg path/to/doc2.png --output output/extracted_data.csv
```

Optional arguments:

- `--lang`: Tesseract language code (default: `eng`)
- `--output`: Output CSV path (default: `output/extracted_data.csv`)

## Output columns

The generated CSV has the following columns:

1. `source_file`
2. `name`
3. `nrc_id_number`
4. `father_name`
5. `company_name`
6. `full_text`

## Run tests

```bash
pytest
```
