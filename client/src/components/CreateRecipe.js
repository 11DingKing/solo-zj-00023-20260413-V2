import React, { useState } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useHistory } from "react-router-dom";

const CreateRecipePage = () => {
  const history = useHistory();
  const [showSuccess, setShowSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [ingredients, setIngredients] = useState([
    { name: "", quantity: "" },
  ]);
  const [steps, setSteps] = useState([{ order: 1, instruction: "" }]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "" }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      setIngredients(newIngredients);
    }
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addStep = () => {
    const newOrder = steps.length + 1;
    setSteps([...steps, { order: newOrder, instruction: "" }]);
  };

  const removeStep = (index) => {
    if (steps.length > 1) {
      const newSteps = steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 }));
      setSteps(newSteps);
    }
  };

  const updateStep = (index, value) => {
    const newSteps = [...steps];
    newSteps[index].instruction = value;
    setSteps(newSteps);
  };

  const createRecipe = (data) => {
    const validIngredients = ingredients.filter(
      (ing) => ing.name.trim() !== ""
    );
    const validSteps = steps.filter((step) => step.instruction.trim() !== "");

    if (validIngredients.length === 0) {
      setServerError("请至少添加一个食材");
      return;
    }

    if (validSteps.length === 0) {
      setServerError("请至少添加一个步骤");
      return;
    }

    const token = localStorage.getItem("REACT_TOKEN_AUTH_KEY");

    const recipeData = {
      title: data.title,
      description: data.description,
      ingredients: validIngredients,
      steps: validSteps,
    };

    const requestOptions = {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${JSON.parse(token)}`,
      },
      body: JSON.stringify(recipeData),
    };

    fetch("/recipe/recipes", requestOptions)
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        throw new Error("创建失败");
      })
      .then((data) => {
        setShowSuccess(true);
        setServerError("");
        reset();
        setIngredients([{ name: "", quantity: "" }]);
        setSteps([{ order: 1, instruction: "" }]);
        setTimeout(() => {
          history.push("/");
        }, 1500);
      })
      .catch((err) => {
        console.log(err);
        setServerError("创建食谱失败，请稍后重试");
      });
  };

  return (
    <div className="container">
      <h1 className="mb-4">创建食谱</h1>

      {showSuccess && (
        <Alert
          variant="success"
          onClose={() => setShowSuccess(false)}
          dismissible
        >
          食谱创建成功！正在跳转到首页...
        </Alert>
      )}

      {serverError && (
        <Alert
          variant="danger"
          onClose={() => setServerError("")}
          dismissible
        >
          {serverError}
        </Alert>
      )}

      <Form onSubmit={handleSubmit(createRecipe)}>
        <Form.Group className="mb-4">
          <Form.Label>食谱名称 *</Form.Label>
          <Form.Control
            type="text"
            placeholder="输入食谱名称"
            {...register("title", { required: true, maxLength: 100 })}
          />
          {errors.title && (
            <p className="text-danger small mt-1 mb-0">
              <small>食谱名称是必填项（最多100字符）</small>
            </p>
          )}
        </Form.Group>

        <Form.Group className="mb-4">
          <Form.Label>食谱描述 *</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="描述这道食谱的特点..."
            {...register("description", { required: true })}
          />
          {errors.description && (
            <p className="text-danger small mt-1 mb-0">
              <small>食谱描述是必填项</small>
            </p>
          )}
        </Form.Group>

        <div className="dynamic-list-container mb-4">
          <div className="dynamic-list-header">
            <h3 className="dynamic-list-title mb-0">食材列表 *</h3>
            <Button variant="primary" size="sm" onClick={addIngredient}>
              + 添加食材
            </Button>
          </div>
          <p className="text-muted small">请至少添加一个食材</p>

          {ingredients.map((ingredient, index) => (
            <div key={index} className="dynamic-item">
              <span className="text-muted small" style={{ minWidth: "60px" }}>
                {index + 1}.
              </span>
              <Form.Control
                type="text"
                placeholder="食材名称"
                className="dynamic-item-input"
                value={ingredient.name}
                onChange={(e) =>
                  updateIngredient(index, "name", e.target.value)
                }
              />
              <Form.Control
                type="text"
                placeholder="用量（如：200g）"
                className="dynamic-item-input"
                style={{ maxWidth: "150px" }}
                value={ingredient.quantity}
                onChange={(e) =>
                  updateIngredient(index, "quantity", e.target.value)
                }
              />
              <button
                type="button"
                className="remove-item-btn"
                onClick={() => removeIngredient(index)}
                disabled={ingredients.length === 1}
                title="删除"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="dynamic-list-container mb-4">
          <div className="dynamic-list-header">
            <h3 className="dynamic-list-title mb-0">制作步骤 *</h3>
            <Button variant="primary" size="sm" onClick={addStep}>
              + 添加步骤
            </Button>
          </div>
          <p className="text-muted small">请至少添加一个制作步骤</p>

          {steps.map((step, index) => (
            <div key={index} className="dynamic-item">
              <span
                className="text-muted small"
                style={{ minWidth: "30px", fontWeight: "bold" }}
              >
                {step.order}
              </span>
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="描述这一步的操作..."
                className="dynamic-item-input"
                value={step.instruction}
                onChange={(e) => updateStep(index, e.target.value)}
              />
              <button
                type="button"
                className="remove-item-btn"
                onClick={() => removeStep(index)}
                disabled={steps.length === 1}
                title="删除"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <Form.Group className="mt-4">
          <Button variant="primary" type="submit" size="lg">
            创建食谱
          </Button>
        </Form.Group>
      </Form>
    </div>
  );
};

export default CreateRecipePage;
