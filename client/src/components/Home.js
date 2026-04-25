import React, { useEffect, useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import Recipe from "./Recipe";
import { Modal, Form, Button, Pagination, Card } from "react-bootstrap";
import { useForm } from "react-hook-form";

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
  const debouncedSearch = useDebounce(searchTerm, 400);

  const {
    register,
    reset,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();
  const [recipeId, setRecipeId] = useState(0);

  const fetchRecipes = useCallback((page, search) => {
    const params = new URLSearchParams();
    params.append("page", page);
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
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchRecipes(1, debouncedSearch);
  }, [debouncedSearch, fetchRecipes]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchRecipes(currentPage, debouncedSearch);
    }
  }, [currentPage, debouncedSearch, fetchRecipes]);

  const getAllRecipes = () => {
    fetchRecipes(currentPage, debouncedSearch);
  };

  const closeModal = () => {
    setShow(false);
  };

  const showModal = (id) => {
    setShow(true);
    setRecipeId(id);
    if (Array.isArray(recipes)) {
      recipes.forEach((recipe) => {
        if (recipe.id == id) {
          setValue("title", recipe.title);
          setValue("description", recipe.description);
        }
      });
    }
  };

  let token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");

  const updateRecipe = (data) => {
    console.log(data);

    const requestOptions = {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${JSON.parse(token)}`,
      },
      body: JSON.stringify(data),
    };

    fetch(`/recipe/recipe/${recipeId}`, requestOptions)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);

        const reload = window.location.reload();
        reload();
      })
      .catch((err) => console.log(err));
  };

  const deleteRecipe = (id) => {
    console.log(id);

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
        console.log(data);
        getAllRecipes();
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

  const renderEmptyState = () => {
    if (recipes.length === 0 && totalItems === 0) {
      return (
        <Card className="recipe">
          <Card.Body>
            <Card.Title className="text-center text-muted">
              没有找到相关食谱
            </Card.Title>
          </Card.Body>
        </Card>
      );
    }
    return null;
  };

  const recipeList = Array.isArray(recipes) ? recipes : [];

  return (
    <div className="recipes container">
      <Modal show={show} size="lg" onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Update Recipe</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            <Form.Group>
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                {...register("title", { required: true, maxLength: 25 })}
              />
            </Form.Group>
            {errors.title && (
              <p style={{ color: "red" }}>
                <small>Title is required</small>
              </p>
            )}
            {errors.title?.type === "maxLength" && (
              <p style={{ color: "red" }}>
                <small>Title should be less than 25 characters</small>
              </p>
            )}
            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                {...register("description", { required: true, maxLength: 255 })}
              />
            </Form.Group>
            {errors.description && (
              <p style={{ color: "red" }}>
                <small>Description is required</small>
              </p>
            )}
            {errors.description?.type === "maxLength" && (
              <p style={{ color: "red" }}>
                <small>Description should be less than 255 characters</small>
              </p>
            )}
            <br></br>
            <Form.Group>
              <Button variant="primary" onClick={handleSubmit(updateRecipe)}>
                Save
              </Button>
            </Form.Group>
          </form>
        </Modal.Body>
      </Modal>
      <h1>List of Recipes</h1>
      <Form.Group className="mb-4 search-container">
        <Form.Control
          type="text"
          placeholder="搜索食谱标题或描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>
      {renderEmptyState()}
      {recipeList.map((recipe, index) => (
        <Recipe
          recipe={recipe}
          key={index}
          onClick={() => {
            showModal(recipe.id);
          }}
          onDelete={() => {
            deleteRecipe(recipe.id);
          }}
        />
      ))}
      {renderPagination()}
    </div>
  );
};

const LoggedOutHome = () => {
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const debouncedSearch = useDebounce(searchTerm, 400);

  const fetchRecipes = useCallback((page, search) => {
    const params = new URLSearchParams();
    params.append("page", page);
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
      });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    fetchRecipes(1, debouncedSearch);
  }, [debouncedSearch, fetchRecipes]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchRecipes(currentPage, debouncedSearch);
    }
  }, [currentPage, debouncedSearch, fetchRecipes]);

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

  const renderEmptyState = () => {
    if (recipes.length === 0 && totalItems === 0) {
      return (
        <Card className="recipe">
          <Card.Body>
            <Card.Title className="text-center text-muted">
              没有找到相关食谱
            </Card.Title>
          </Card.Body>
        </Card>
      );
    }
    return null;
  };

  const recipeList = Array.isArray(recipes) ? recipes : [];

  return (
    <div className="recipes container">
      <h1 className="heading">Welcome to the Recipes</h1>
      <Link to="/signup" className="btn btn-primary btn-lg">
        Get Started
      </Link>
      <br />
      <br />
      <h2>Browse Recipes</h2>
      <Form.Group className="mb-4 search-container">
        <Form.Control
          type="text"
          placeholder="搜索食谱标题或描述..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Form.Group>
      {renderEmptyState()}
      {recipeList.map((recipe, index) => (
        <Recipe recipe={recipe} key={index} />
      ))}
      {renderPagination()}
    </div>
  );
};

const HomePage = () => {
  const [logged] = useAuth();

  return <div>{logged ? <LoggedinHome /> : <LoggedOutHome />}</div>;
};

export default HomePage;
