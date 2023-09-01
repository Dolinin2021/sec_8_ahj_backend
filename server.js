import { randomUUID } from 'crypto';
import { createServer } from 'http';
import Koa from 'koa';
import koaBody from 'koa-body';

const app = new Koa();
const server = createServer(app.callback());
const port = process.env.PORT || 7070;

// => CORS
app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*', };

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({...headers});
    try {
      return await next();
    } catch (e) {
      e.headers = {...e.headers, ...headers};
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});

// => Body Parsers
app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

let tickets = [
  {
    id: randomUUID(),
    name: "Поменять краску в принтере, ком. 404",
    description: "Принтер HP LJ-1210, картриджи на складе",
    status: false,
    created: new Date().toLocaleDateString(),
  },
  {
    id: randomUUID(),
    name: "Переустановить Windows, PC-Hall24",
    description: "",
    status: false,
    created: new Date().toLocaleDateString(),
  },
  {
    id: randomUUID(),
    name: "Установить обновление KB-31642dv3875",
    description: "Вышло критическое обновление для Windows",
    status: false,
    created: new Date().toLocaleDateString(),
  },
];

app.use(async ctx => {
  let params = new URL('http://localhost:'+ port + ctx.url).searchParams;
  let method = params.get("method");

  switch (method) {
    case 'allTickets':
      let arr = [];
      tickets.forEach(element => {
        arr.push({
          'id': element.id, 
          'name': element.name, 
          'status': element.status, 
          'created': element.created
        });
      });
      ctx.response.body = arr;
      return;

    case "ticketById": {
      let id = params.get("id");
      const ticket = tickets.find(item => item.id == id);
      if (!ticket) {
        ctx.response.status = 404;
        ctx.response.body = "Ticket not found";
        return;
      }
      ctx.response.body = ticket;
      return;
    }

    case "createTicket": {
      try {
        let params = new URL('http://localhost:'+ port + ctx.request.url).searchParams;
        let name = params.get("name");
        let description = params.get("description");
        let status = params.get("status");

        const newTicket = {
          id: randomUUID(),
          name: name,
          status: status,
          description: description || "",
          created: new Date().toLocaleDateString(),
        };

        tickets.push(newTicket);
        ctx.response.body = newTicket;
        
      } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = JSON.stringify({ error: error.message });
      }
      return;
    }

    default:
      ctx.response.status = 404;
      return;
  }
});

server.listen(port, (err) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log('Server is listening to ' + port);
});
