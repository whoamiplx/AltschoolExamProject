import React, { useEffect, useState, useMemo } from "react";
import axios,  { AxiosError } from 'axios';
import { Link } from "react-router-dom";
import {
  Checkbox,
  Modal,
  Form,
  Input,
  Button,
  notification,
  Dropdown,
  Menu,
  MenuProps,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FilterOutlined,
  SunOutlined,
  MoonOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import "../styles/todoList.css";

// Type definitions
interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

interface TodoFormValues {
  title: string;
  completed?: boolean;
}

interface TodoListProps {
  toggleTheme: () => void;
  currentTheme: "light" | "dark";
}

type FilterStatus = "all" | "completed" | "incomplete";

const TodoList: React.FC<TodoListProps> = ({ toggleTheme, currentTheme }) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState<boolean>(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [deletingTodoId, setDeletingTodoId] = useState<number | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const [successModalTitle, setSuccessModalTitle] = useState<string>("");
  const [successModalMessage, setSuccessModalMessage] = useState<string>("");

  const [addForm] = Form.useForm<TodoFormValues>();
  const [editForm] = Form.useForm<TodoFormValues>();

  const todosPerPage: number = 10;
  const BASE_URL: string = "https://jsonplaceholder.typicode.com/todos";

  const displaySuccessModal = (title: string, message: string): void => {
    setSuccessModalTitle(title);
    setSuccessModalMessage(message);
    setShowSuccessModal(true);
  };

  useEffect(() => {
    const fetchTodos = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get<Todo[]>(BASE_URL);
        setTodos(response.data);
      } catch (err) {
        let errorMessage = "Oops! Failed to load todos.";
        if (axios.isAxiosError(err)) {
          const axiosError = err as AxiosError;
          if (axiosError.response) {
            errorMessage = `Error: ${axiosError.response.status} - ${
              axiosError.response.statusText || "Server Error"
            }`;
          } else if (axiosError.request) {
            errorMessage = "Network error. No response received from server.";
          } else {
            errorMessage = axiosError.message;
          }
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(new Error(errorMessage));
        notification.error({
          message: "API Error",
          description: errorMessage,
          placement: "topRight",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTodos();
  }, []);

  const handleAddTodo = async (values: TodoFormValues): Promise<void> => {
    try {
      const response = await axios.post<Todo>(BASE_URL, {
        title: values.title,
        completed: false,
        userId: 1,
      });
      const newTodo: Todo = {
        ...response.data,
        id: Math.max(...todos.map((t) => t.id), 200) + 1,
      };
      setTodos((prevTodos) => [newTodo, ...prevTodos]);
      setIsAddModalVisible(false);
      addForm.resetFields();
      displaySuccessModal(
        "Todo Added Successfully!",
        `"${values.title}" has been added. (Note: JSONPlaceholder simulates this; data is not persistent)`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Could not add todo.";
      notification.error({
        message: "Add Todo Failed",
        description: errorMessage,
        placement: "topRight",
      });
    }
  };

  const handleEditClick = (todo: Todo): void => {
    setEditingTodo(todo);
    editForm.setFieldsValue({ title: todo.title, completed: todo.completed });
    setIsEditModalVisible(true);
  };

  const handleUpdateTodo = async (values: TodoFormValues): Promise<void> => {
    if (!editingTodo) return;
    try {
      const updatedTodoData: Todo = {
        id: editingTodo.id,
        title: values.title,
        completed: values.completed || false,
        userId: editingTodo.userId,
      };
      await axios.put(`${BASE_URL}/${editingTodo.id}`, updatedTodoData);
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === editingTodo.id ? updatedTodoData : todo
        )
      );
      setIsEditModalVisible(false);
      setEditingTodo(null);
      displaySuccessModal(
        "Todo Edited Successfully!",
        `"${values.title}" has been updated. (Important notice: Data is not persistent as JSONPlaceholder simulates this)`
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Could not update todo.";
      notification.error({
        message: "Todo Update Failed",
        description: errorMessage,
        placement: "topRight",
      });
    }
  };

  const handleDeleteClick = (id: number): void => {
    setDeletingTodoId(id);
    setIsDeleteConfirmVisible(true);
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!deletingTodoId) return;
    try {
      await axios.delete(`${BASE_URL}/${deletingTodoId}`);
      setTodos((prevTodos) =>
        prevTodos.filter((todo) => todo.id !== deletingTodoId)
      );
      setIsDeleteConfirmVisible(false);
      setDeletingTodoId(null);
      displaySuccessModal(
        "Todo Deleted Successfully!",
        "Task has been deleted. (Important notice: Data is not persistent as JSONPlaceholder simulates this)"
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Could not delete todo.";
      notification.error({
        message: "Sorry, Delete Failed",
        description: errorMessage,
        placement: "topRight",
      });
    }
  };

  const filteredAndSearchedTodos = useMemo((): Todo[] => {
    let filtered = todos;

    if (filterStatus === "completed") {
      filtered = filtered.filter((todo) => todo.completed);
    } else if (filterStatus === "incomplete") {
      filtered = filtered.filter((todo) => !todo.completed);
    }

    if (searchTerm) {
      filtered = filtered.filter((todo) =>
        todo.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return filtered;
  }, [todos, filterStatus, searchTerm]);

  const indexOfLastTodo: number = currentPage * todosPerPage;
  const indexOfFirstTodo: number = indexOfLastTodo - todosPerPage;
  const currentTodos: Todo[] = filteredAndSearchedTodos.slice(
    indexOfFirstTodo,
    indexOfLastTodo
  );
  const totalPages: number = Math.ceil(filteredAndSearchedTodos.length / todosPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  const paginate = (pageNumber: number): void => setCurrentPage(pageNumber);

  const renderPageNumbers = (): React.ReactNode[] => {
    const pageNumbers: (number | string)[] = [];
    const maxPageButtons = 5;

    if (totalPages <= maxPageButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
      let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

      if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - maxPageButtons + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      if (startPage > 1) {
        if (startPage > 2) pageNumbers.unshift("...");
        pageNumbers.unshift(1);
      }
      if (endPage < totalPages) {
        if (endPage < totalPages - 1) pageNumbers.push("...");
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers.map((number, index) =>
      typeof number === "number" ? (
        <button
          key={number}
          onClick={() => paginate(number)}
          className={`pagination-button ${
            currentPage === number ? "active" : ""
          }`}
          aria-label={`Go to page ${number}`}
        >
          {number}
        </button>
      ) : (
        <span
          key={`ellipsis-${index}`}
          className="current-page-info"
          aria-hidden="true"
        >
          ...
        </span>
      )
    );
  };

  const handleFilterMenuClick: MenuProps['onClick'] = ({ key }): void => {
    setFilterStatus(key as FilterStatus);
  };

  const filterMenu: MenuProps = {
    onClick: handleFilterMenuClick,
    selectedKeys: [filterStatus],
    items: [
      { key: "all", label: "All" },
      { key: "completed", label: "Completed" },
      { key: "incomplete", label: "Incomplete" },
    ],
  };

  if (loading) {
    return (
      <div className="todo-list-container" role="status" aria-live="polite">
        <div className="todo-list-wrapper">
          <div className="loading-state-container">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading todos, please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="todo-list-container" role="alert" aria-live="assertive">
        <div className="todo-list-wrapper">
          <p className="error-message">Error: {error.message}</p>
          <p className="error-message">
            Please check your network connection or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="todo-list-container">
      <div className="todo-list-wrapper">
        <header className="todo-list-header">
          <h2>Hot Girl Checklist</h2>
          <div className="header-controls-row">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setIsAddModalVisible(true)}
              className="add-todo-button"
              aria-label="Add new todo"
            >
              Add New Todo
            </Button>
            <label htmlFor="search-todo" className="visually-hidden">
              Search Todos
            </label>
            <Input
              id="search-todo"
              className="search-input"
              placeholder="Q Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search todos by title"
            />

            <Dropdown
              menu={filterMenu}
              trigger={["click"]}
              placement="bottomRight"
            >
              <Button
                className="filter-dropdown-button"
                aria-label="Filter todos"
              >
                <FilterOutlined /> Filter
              </Button>
            </Dropdown>

            <Button
              onClick={toggleTheme}
              className="theme-toggle-button"
              aria-label={`Switch to ${
                currentTheme === "light" ? "dark" : "light"
              } mode`}
            >
              {currentTheme === "light" ? <MoonOutlined /> : <SunOutlined />}
              <span className="visually-hidden">
                Switch to {currentTheme === "light" ? "dark" : "light"} mode
              </span>
            </Button>
          </div>
        </header>

        <section className="todo-items-grid" aria-live="polite">
          {currentTodos.length === 0 && !loading && !error ? (
            <p className="no-todos-message">
              Sorry, Nothing here. You either finished everything... or forgot to add them.
            </p>
          ) : (
            currentTodos.map((todo: Todo) => (
              <div key={todo.id} className="todo-item-card">
                <div className="todo-item-card-content">
                  <Checkbox
                    checked={todo.completed}
                    disabled
                    aria-label={`Todo ${todo.title} is ${
                      todo.completed ? "completed" : "not completed"
                    }`}
                  />
                  <span
                    className={`todo-item-title ${
                      todo.completed ? "completed-text" : ""
                    }`}
                  >
                    {todo.title}
                  </span>
                </div>
                <div className="todo-card-footer">
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => handleEditClick(todo)}
                    className="action-button edit-button"
                    aria-label={`Edit todo: ${todo.title}`}
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteClick(todo.id)}
                    className="action-button delete-button"
                    aria-label={`Delete todo: ${todo.title}`}
                    size="small"
                  >
                    Delete
                  </Button>
                  <Link
                    to={`/todos/${todo.id}`}
                    className="action-button view-button"
                    aria-label={`View details for todo: ${todo.title}`}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>

        <nav className="pagination-controls" aria-label="Pagination Navigation">
          <button
            className="pagination-button"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            Previous
          </button>

          {renderPageNumbers()}

          <button
            className="pagination-button"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            aria-label="Go to next page"
          >
            Next
          </button>
        </nav>
      </div>

      <Modal
        title="Add New Todo"
        open={isAddModalVisible}
        onCancel={() => {
          setIsAddModalVisible(false);
          addForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={addForm}
          onFinish={handleAddTodo}
          layout="vertical"
          initialValues={{ completed: false }}
        >
          <Form.Item
            name="title"
            label="Todo Title"
            rules={[
              { required: true, message: "What's the plan, bestie?" },
            ]}
          >
            <Input placeholder="e.g., Plan social media content" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="add-todo-modal-button"
            >
              Add Todo
            </Button>
            <Button
              onClick={() => {
                setIsAddModalVisible(false);
                addForm.resetFields();
              }}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Edit Todo"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingTodo(null);
          editForm.resetFields();
        }}
        footer={null}
      >
        <Form form={editForm} onFinish={handleUpdateTodo} layout="vertical">
          <Form.Item
            name="title"
            label="Todo Title"
            rules={[
              { required: true, message: "What's the plan, bestie?" },
            ]}
          >
            <Input placeholder="e.g., Make Bed" />
          </Form.Item>
          <Form.Item name="completed" valuePropName="checked">
            <Checkbox>Completed</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update Todo
            </Button>
            <Button
              onClick={() => {
                setIsEditModalVisible(false);
                setEditingTodo(null);
                editForm.resetFields();
              }}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Confirm Delete"
        open={isDeleteConfirmVisible}
        onOk={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteConfirmVisible(false);
          setDeletingTodoId(null);
        }}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ type: "danger" }}
      >
        <p>
          Delete it like you delete red flags?
        </p>
      </Modal>

      <Modal
        open={showSuccessModal}
        title={successModalTitle}
        onCancel={() => setShowSuccessModal(false)}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setShowSuccessModal(false)}
          >
            OK
          </Button>,
        ]}
        centered
      >
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <CheckCircleOutlined style={{ fontSize: "48px", color: "#28a745" }} />
        </div>
        <p style={{ textAlign: "center", fontSize: "1.1em", color: "#333333" }}>
          {successModalMessage}
        </p>
      </Modal>
    </main>
  );
};

export default TodoList;