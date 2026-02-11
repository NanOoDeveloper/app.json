from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import parse_document_fields


def test_parse_document_fields_with_labels():
    text = """
    Name: Aung Aung
    NRC ID Number: 12/ABC(N)123456
    Father's Name: U Ba
    Company Name: Acme Co., Ltd
    """

    result = parse_document_fields(text)

    assert result.name == "Aung Aung"
    assert result.nrc_id_number == "12/ABC(N)123456"
    assert result.father_name == "U Ba"
    assert result.company_name == "Acme Co., Ltd"
    assert "Name: Aung Aung" in result.full_text


def test_parse_document_fields_name_fallback():
    text = """
    Aung Aung
    Something else
    """

    result = parse_document_fields(text)

    assert result.name == "Aung Aung"
