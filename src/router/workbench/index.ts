import Router from 'koa-router';

const router = new Router();

// 记录表
// let idCount = 4;
const list: any[] = [
  {
    id: '001',
    date: '2021-11-13',
  },
];


router
  // 查询
  .get('/list', async (ctx) => {
    ctx.body = {
      code: 200,
      data: {
        total: list.length,
        list: list,
      },
    };
  })
  // 添加
  .post('/list', async (ctx) => {
  })
  // 修改
  .put('/list/:id', async (ctx) => {
  })
  // 删除
  .delete('/list/:id', async (ctx) => {
  });

export default router;
