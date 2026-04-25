import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { Modal, Form, Button, Pagination } from "react-bootstrap";
import { useForm } from "react-hook-form";
import RecipeCard from "./RecipeCard";

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

const LoggedinHome = () => {
  const [recipes, setRecipes] = useState([]);
  const [show, setShow] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const debouncedSearch = useDebounce(searchTerm, 400);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  const fetchRecipes = useCallback((page, search, sort) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", 8);
    params.append("sort_by", sort);
    if (search) {
      params.append("search", search);
    }

    fetch(`/recipe/recipes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setRecipes(data.items);
          setCurrentPage(data.page || 1);
          setTotalPages(data.pages || 0);
          setTotalItems(data.total || 0);
        } else if (Array.isArray(data)) {
          setRecipes(data);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalItems(data.length);
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchRecipes(1, debouncedSearch, sortBy);
  }, [debouncedSearch, sortBy, fetchRecipes]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchRecipes(currentPage, debouncedSearch, sortBy);
    }
  }, [currentPage, debouncedSearch, sortBy, fetchRecipes]);

  const closeModal = () => {
    setShow(false);
    setEditingRecipe(null);
    reset();
  };

  const showEditModal = (recipe) => {
    setEditingRecipe(recipe);
    setShow(true);
    setValue("title", recipe.title);
    setValue("description", recipe.description);
  };

  const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");

  const updateRecipe = (data) => {
    if (!editingRecipe) return;

    const requestOptions = {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${JSON.parse(token)}`,
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        ingredients: editingRecipe.ingredients || [],
        steps: editingRecipe.steps || [],
      }),
    };

    fetch(`/recipe/recipe/${editingRecipe.id}`, requestOptions)
      .then((res) => res.json())
      .then((data) => {
        closeModal();
        fetchRecipes(currentPage, debouncedSearch, sortBy);
      })
      .catch((err) => console.log(err));
  };

  const deleteRecipe = (id) => {
    if (!window.confirm("确定要删除这个食谱吗？")) return;

    const requestOptions = {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${JSON.parse(token)}`,
      },
    };

    fetch(`/recipe/recipe/${id}`, requestOptions)
      .then((res) => res.json())
      .then((data) => {
        fetchRecipes(currentPage, debouncedSearch, sortBy);
      })
      .catch((err) => console.log(err));
  };

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

  return (
    <div className="container">
      <Modal show={show} size="lg" onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>编辑食谱</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <Form.Group>
              <Form.Label>标题</Form.Label>
              <Form.Control
                type="text"
                {...register("title", { required: true, maxLength: 100 })}
              />
            </Form.Group>
            {errors.title && (
              <p style={{ color: "red" }}>
                <small>标题是必填项</small>
              </p>
            )}
            <Form.Group className="mt-3">
              <Form.Label>描述</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                {...register("description", { required: true })}
              />
            </Form.Group>
            {errors.description && (
              <p style={{ color: "red" }}>
                <small>描述是必填项</small>
              </p>
            )}
            <p className="text-muted small mt-2">
              提示：食材和步骤需要在创建食谱时设置。
            </p>
            <br />
            <Form.Group>
              <Button variant="primary" onClick={handleSubmit(updateRecipe)}>
                保存
              </Button>
            </Form.Group>
          </form>
        </Modal.Body>
      </Modal>

      <h1 className="mb-4">食谱列表</h1>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <Form.Group className="search-container mb-0">
          <Form.Control
            type="text"
            placeholder="搜索食谱标题或描述..."
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
            <option value="created_at">按创建时间</option>
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
          <div className="empty-state-icon">🍳</div>
          <h2 className="empty-state-title">暂无食谱</h2>
          <p className="empty-state-text">
            {searchTerm ? "没有找到匹配的食谱，请尝试其他关键词。" : "还没有任何食谱，快来创建第一个吧！"}
          </p>
          <Link to="/create_recipe" className="btn btn-primary mt-3">
            创建食谱
          </Link>
        </div>
      ) : (
        <>
          <div className="recipes-grid">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onUpdate={showEditModal}
                onDelete={deleteRecipe}
              />
            ))}
          </div>
          {renderPagination()}
        </>
      )}
    </div>
  );
};

const LoggedOutHome = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState("created_at");
  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchRecipes = useCallback((page, search, sort) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("per_page", 8);
    params.append("sort_by", sort);
    if (search) {
      params.append("search", search);
    }

    fetch(`/recipe/recipes?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setRecipes(data.items);
          setCurrentPage(data.page || 1);
          setTotalPages(data.pages || 0);
          setTotalItems(data.total || 0);
        } else if (Array.isArray(data)) {
          setRecipes(data);
          setCurrentPage(1);
          setTotalPages(1);
          setTotalItems(data.length);
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
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchRecipes(1, debouncedSearch, sortBy);
  }, [debouncedSearch, sortBy, fetchRecipes]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchRecipes(currentPage, debouncedSearch, sortBy);
    }
  }, [currentPage, debouncedSearch, sortBy, fetchRecipes]);

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

  return (
    <div className="container">
      <div className="text-center py-5 mb-4">
        <h1 className="heading mb-4">欢迎来到食谱分享平台</h1>
        <p className="lead text-muted mb-4">
          发现美食，分享厨艺，记录每一道美味
        </p>
        <div className="d-flex justify-content-center gap-3">
          <Link to="/signup" className="btn btn-primary btn-lg">
            立即注册
          </Link>
          <Link to="/login" className="btn btn-outline-primary btn-lg">
            登录账户
          </Link>
        </div>
      </div>

      <h2 className="mb-4">浏览食谱</h2>

      <div className="d-flex flex-wrap gap-3 mb-4">
        <Form.Group className="search-container mb-0">
          <Form.Control
            type="text"
            placeholder="搜索食谱标题或描述..."
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
            <option value="created_at">按创建时间</option>
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
          <div className="empty-state-icon">🍳</div>
          <h2 className="empty-state-title">暂无食谱</h2>
          <p className="empty-state-text">
            {searchTerm ? "没有找到匹配的食谱，请尝试其他关键词。" : "还没有任何食谱。"}
          </p>
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

const HomePage = () => {
  const [logged] = useAuth();

  return <div>{logged ? <LoggedinHome /> : <LoggedOutHome />}</div>;
};

export default HomePage;
