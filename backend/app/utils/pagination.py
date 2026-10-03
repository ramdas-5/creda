from math import ceil
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel):
    items: list
    total: int
    page: int
    size: int
    pages: int


def paginate_query(query, page: int = 1, size: int = 20):
    page = max(1, page)
    size = min(max(1, size), 100)
    total = query.count()
    items = query.offset((page - 1) * size).limit(size).all()
    pages = ceil(total / size) if size else 0
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}
