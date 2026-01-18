from pdf2image import convert_from_path
from pathlib import Path

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def convert_pdf_to_images(pdf_path):
    pages = convert_from_path(str(pdf_path))
    image_paths = []

    base_name = Path(pdf_path).stem

    for i, page in enumerate(pages):
        img_path = UPLOAD_DIR / f"{base_name}_page_{i}.jpg"
        page.save(img_path, "JPEG")
        image_paths.append(str(img_path))

    return image_paths
