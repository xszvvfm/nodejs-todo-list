/*** API 요청을 받기 위한 기본 뼈대 구성 ***/

// Express 라이브러리 가져오기
import express from 'express';
import connect from './schemas/index.js';
import TodosRouter from './routes/todos.router.js';
import ErrorHandlerMiddleware from './middlewares/error-handler.middleware.js';

const app = express(); // app 생성
const PORT = 3000; // 포트 번호 3000번

connect();

// Express에서 req.body에 접근하여 body 데이터를 사용할 수 있도록 설정합니다.
app.use(express.json()); // app에 전역으로 middleware 등록. express.json()을 통해 body-parser 구현 (request.body의 데이터를 사용할 수 있도록)
app.use(express.urlencoded({ extended: true })); // express.urlencoded()을 통해 content type이 true인 경우에 body 데이터를 가져올 수 있도록 구현

// static Middleware, express.static()을 사용하여 정적 파일 제공
app.use(express.static('./assets')); // express.static()을 통해 assets 폴더에 있는 프론트엔드 파일을 서빙하도록 구현

// router 생성 (Express의 router 기능 사용한다)
const router = express.Router();

// 생성한 router에 API 구현
router.get('/', (req, res) => {
  return res.json({ message: 'Hi!' });
});

// router를 전역 middleware로 등록하여 앞에 "/api"가 붙은 경우에만 해당하는 api로 접근 가능하도록 합니다.
// /api 주소로 접근하였을 때, router와 TodosRouter로 클라이언트의 요청이 전달됩니다.
app.use('/api', [router, TodosRouter]);

// 에러 처리 미들웨어를 등록합니다.
app.use(ErrorHandlerMiddleware);

// 서버 열 때, 포트 번호 3000번으로 열도록 구현
app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
