"""
Shared pagination and query helper utilities for list endpoints.
"""

from typing import Generic, TypeVar, List
from math import ceil
from pydantic import BaseModel
from sqlalchemy.orm import Query

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


def paginate(query: Query, page: int = 1, page_size: int = 20) -> tuple[List, int, int]:
    """
    Applies limit and offset to a SQLAlchemy query and returns (items, total, total_pages).
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 20
    elif page_size > 100:
        page_size = 100

    total = query.count()
    total_pages = ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()

    return items, total, total_pages
