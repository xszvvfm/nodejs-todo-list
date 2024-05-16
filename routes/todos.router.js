// /routes/todos.router.js

import express from 'express';
import Joi from 'joi';
import Todo from '../schemas/todo.schema.js';

const router = express.Router();

/***** 할 일 등록 API 유효성 검사 *****/
// 할 일 등록 API의 요청 데이터 검증을 위한 Joi 스키마를 정의합니다.
const createTodoSchema = Joi.object({
  value: Joi.string().min(1).max(50).required(),
});

/*** 할 일 등록 API ***/
router.post('/todos', async (req, res, next) => {
  try {
    // 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
    //   const { value } = req.body;

    // 클라이언트에게 전달받은 데이터를 검증합니다.
    const validation = await createTodoSchema.validateAsync(req.body);

    // 클라이언트에게 전달받은 value 데이터를 변수에 저장합니다.
    const { value } = validation;

    // value가 존재하지 않을 때, 클라이언트에게 에러 메시지를 전달합니다.
    if (!value) {
      return res
        .status(400)
        .json({ errorMessage: '해야할 일 데이터가 존재하지 않습니다.' });
    }

    // Todo 모델을 사용해, MongoDB에서 'order' 값이 가장 높은 '해야할 일'을 찾습니다.
    const todoMaxOrder = await Todo.findOne().sort('-order').exec();

    // 'order' 값이 가장 높은 document의 1을 추가하거나 없다면, 1을 할당합니다.
    const order = todoMaxOrder ? todoMaxOrder.order + 1 : 1;

    // Todo 모델을 이용해, 새로운 '해야할 일'을 생성합니다.
    const todo = new Todo({ value, order });

    // 생성한 '해야할 일'을 MongoDB에 저장합니다.
    await todo.save();

    return res.status(201).json({ todo });
  } catch (error) {
    // 발생한 에러를 다음 에러 처리 미들웨어로 전달합니다.
    next(error);
  }
});

/*** 할 일 목록 조회 API ***/
router.get('/todos', async (req, res) => {
  // Todo 모델을 이용해, MongoDB에서 'order' 값이 가장 높은 '해야할 일'을 찾습니다.
  const todos = await Todo.find().sort('-order').exec();

  // 찾은 '해야할 일'을 클라이언트에게 전달합니다.
  return res.status(200).json({ todos });
});

/*** 할 일 순서 변경, 완료/해제, 내용 변경 API ***/
router.patch('/todos/:todoId', async (req, res) => {
  // 변경할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;
  // 클라이언트가 전달한 순서, 완료 여부, 내용 데이터를 가져옵니다.
  const { order, done, value } = req.body;

  // 변경하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const currentTodo = await Todo.findById(todoId).exec();
  if (!currentTodo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 todo 데이터입니다.' });
  }

  if (order) {
    // 변경하려는 order 값을 가지고 있는 '해야할 일'을 찾습니다.
    const targetTodo = await Todo.findOne({ order }).exec();
    if (targetTodo) {
      // 만약, 이미 해당 order 값을 가진 '해야할 일'이 있다면, 해당 '해야할 일'의 order 값을 변경하고 저장합니다.
      targetTodo.order = currentTodo.order;
      await targetTodo.save();
    }
    // 변경하려는 '해야할 일'의 order 값을 변경합니다.
    currentTodo.order = order;
  }
  if (done !== undefined) {
    // 변경하려는 '해야할 일'의 doneAt 값을 변경합니다.
    currentTodo.doneAt = done ? new Date() : null;
  }
  if (value) {
    // 변경하려는 '해야할 일'의 내용을 변경합니다.
    currentTodo.value = value;
  }

  // 변경된 '해야할 일'을 저장합니다.
  await currentTodo.save();

  return res.status(200).json({});
});

/*** 할 일 삭제 API ***/
router.delete('/todos/:todoId', async (req, res) => {
  // 삭제할 '해야할 일'의 ID 값을 가져옵니다.
  const { todoId } = req.params;

  // 삭제하려는 '해야할 일'을 가져옵니다. 만약, 해당 ID값을 가진 '해야할 일'이 없다면 에러를 발생시킵니다.
  const todo = await Todo.findById(todoId).exec();
  if (!todo) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 todo 데이터입니다.' });
  }

  // 조회된 '해야할 일'을 삭제합니다.
  await Todo.deleteOne({ _id: todoId }).exec();

  return res.status(200).json({});
});

export default router;
