import React, { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../auth";
import { Pagination, Form } from "react-bootstrap";
import RecipeCard from "./RecipeCard";
import { Link } from "react-router-dom";

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
};

const Favorites = () => {
  const [logged] = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchFavorites = useCallback(
    (page, search, sort) => {
      if (!logged) return;

      setLoading(true);
      const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");

      const params = new URLSearchParams();
      params.append("page", page);
      params.append("per_page", 8);
      params.append("sort_by", sort);

      fetch(`/recipe/favorites?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${JSON.parse(token)}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.items)) {
            setRecipes(data.items);
            setCurrentPage(data.page || 1);
            setTotalPages(data.pages || 0);
            setTotalItems(data.total || 0);
          } else {
            setRecipes([]);
            setCurrentPage(1);
            setTotalPages(0);
            setTotalItems(0);
          }
        })
        .catch((err) => {
          console.log(err);
          setRecipes([]);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [logged]
  );

  useEffect(() => {
    setCurrentPage(1);
    fetchFavorites(1, debouncedSearch, sortBy);
  }, [debouncedSearch, sortBy, fetchFavorites]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchFavorites(currentPage, debouncedSearch, sortBy);
    }
  }, [currentPage, debouncedSearch, sortBy, fetchFavorites]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    return (
      <div className="pagination-container">
        <Pagination>
          <Pagination.Prev
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {items}
          <Pagination.Next
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>
    );
  };

  if (!logged) {
    return (
      <div className="container">
        <div className="empty-state">
          <div className="empty-state-icon">♥</div>
          <h2 className="empty-state-title">请先登录</h2>
          <p className="empty-state-text">
            您需要先登录才能查看收藏的食谱。
          </p>
          <Link to="/login" className="btn btn-primary mt-3">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="mb-4">我的收藏</h1>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <Form.Group className="search-container mb-0">
          <Form.Control
            type="text"
            placeholder="搜索收藏的食谱..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Form.Group>

        <div className="sort-container mb-0">
          <span className="sort-label">排序:</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="created_at">按收藏时间</option>
            <option value="rating">按评分</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">♥</div>
          <h2 className="empty-state-title">暂无收藏</h2>
          <p className="empty-state-text">
            您还没有收藏任何食谱。去发现一些美味的食谱吧！
          </p>
          <Link to="/" className="btn btn-primary mt-3">
            浏览食谱
          </Link>
        </div>
      ) : (
        <>
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

export default Favorites;
