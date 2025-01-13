/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import { getTodos, USER_ID } from './api/todos';
import { client } from './utils/fetchClient';
import { Todo } from './types/Todo';
import classNames from 'classnames';

type FilterMethods = 'All' | 'Completed' | 'Active';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [error, setError] = useState<string | null>('');
  const [loading, setLoading] = useState(false);
  const [formValue, setFormValue] = useState('');

  const [filterMethod, setFilterMethod] = useState<FilterMethods>('All');

  useEffect(() => {
    setLoading(true);
    getTodos()
      .then(loadedTodos => {
        if (todos.length === 0) {
          setError('You dont have todos at all!');
        }

        setTodos(loadedTodos);
        setError(null);
      })
      .catch(() => {
        setError('Unable to load todos');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [todos.length]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null); // Скидає помилку через 3 секунди
      }, 3000);

      return () => clearTimeout(timer); // Очищаємо таймер, якщо компонент буде видалений
    }
  }, [error]);

  const countOfItemsLeft = (elements: Todo[]) => {
    const filtered = elements.filter(el => el.completed === false);

    return filtered.length;
  };

  const clearCompleted = () => {
    setTodos(current => current.filter(el => el.completed === false));
  };

  function filterTodos(elements: Todo[], method: FilterMethods) {
    let copyForFilter = [...elements];

    if (method === 'All') {
      return todos;
    }

    if (method === 'Active') {
      copyForFilter = copyForFilter.filter(el => el.completed === false);
    }

    if (method === 'Completed') {
      copyForFilter = copyForFilter.filter(el => el.completed === true);
    }

    return copyForFilter;
  }

  const visibleTodos = filterTodos(todos, filterMethod);

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      {loading && (
        <div className="global-loader">
          <div className="loader"></div>
        </div>
      )}

      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {/* this button should have `active` class only if all todos are completed */}
          <button
            type="button"
            className="todoapp__toggle-all active"
            data-cy="ToggleAllButton"
          />

          {/* Add a todo on form submit */}
          <form
            onSubmit={async ev => {
              ev.preventDefault();

              if (!formValue.trim()) {
                setError('Value is empty');
              }

              const newTodo = {
                title: formValue,
                userId: USER_ID,
                completed: false,
              };

              try {
                const addedTodo = await client.post<Todo>('todos/', newTodo);

                setTodos(current => [...current, addedTodo]);
                setFormValue('');
              } catch {
                setError('Unable to add a new todo. Please try again.');
              }
            }}
          >
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              placeholder="What needs to be done?"
              value={formValue}
              onChange={event => setFormValue(event.target.value)}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {/* This is a completed todo */}

          {visibleTodos.map(todo => {
            return (
              <div
                data-cy="Todo"
                className={classNames(
                  todo.completed ? 'todo completed' : 'todo',
                )}
                key={todo.id}
              >
                <label className="todo__status-label">
                  <input
                    data-cy="TodoStatus"
                    type="checkbox"
                    className="todo__status"
                    checked={todo.completed}
                  />
                </label>

                <span data-cy="TodoTitle" className="todo__title">
                  {todo.title}
                </span>
                <button
                  type="button"
                  className="todo__remove"
                  data-cy="TodoDelete"
                >
                  ×
                </button>

                <div data-cy="TodoLoader" className="modal overlay">
                  <div className="modal-background has-background-white-ter" />
                  <div className="loader" />
                </div>
              </div>
            );
          })}
        </section>

        {/* Hide the footer if there are no todos */}
        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {`${countOfItemsLeft(todos)} items left`}
            </span>

            {/* Active link should have the 'selected' class */}
            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={classNames(
                  filterMethod === 'All'
                    ? 'filter__link selected'
                    : 'filter__link',
                )}
                data-cy="FilterLinkAll"
                onClick={e => {
                  e.preventDefault();
                  setFilterMethod('All');
                }}
              >
                All
              </a>

              <a
                href="#/active"
                className={classNames(
                  filterMethod === 'Active'
                    ? 'filter__link selected'
                    : 'filter__link',
                )}
                data-cy="FilterLinkActive"
                onClick={e => {
                  e.preventDefault();
                  setFilterMethod('Active');
                }}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={classNames(
                  filterMethod === 'Completed'
                    ? 'filter__link selected'
                    : 'filter__link',
                )}
                data-cy="FilterLinkCompleted"
                onClick={e => {
                  e.preventDefault();
                  setFilterMethod('Completed');
                }}
              >
                Completed
              </a>
            </nav>

            {/* this button should be disabled if there are no completed todos */}
            {todos.some(el => el.completed === true) && (
              <button
                type="button"
                className="todoapp__clear-completed"
                data-cy="ClearCompletedButton"
                onClick={e => {
                  e.preventDefault();
                  clearCompleted();
                }}
              >
                Clear completed
              </button>
            )}
          </footer>
        )}
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}

      <div
        data-cy="ErrorNotification"
        className={classNames(
          error === null
            ? 'notification is-danger is-light has-text-weight-normal hidden'
            : 'notification is-danger is-light has-text-weight-normal',
        )}
      >
        <button data-cy="HideErrorButton" type="button" className="delete" />
        {/* show only one message at a time */}
        {error}
      </div>
    </div>
  );
};
