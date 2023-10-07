import { randomUUID } from 'crypto';
import { createServer } from 'http';
import Koa from 'koa';
import cors from '@koa/cors';
import koaBody from 'koa-body';

const app = new Koa();
const server = createServer(app.callback());
const port = process.env.PORT || 7070;

app.use(cors());

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
    status: true,
    created: new Date(),
  },
  {
    id: randomUUID(),
    name: "Переустановить Windows, PC-Hall24",
    description: "Переустановить Windows с помощью BIOS",
    status: false,
    created: new Date(),
  },
  {
    id: randomUUID(),
    name: "Установить обновление KB-31642dv3875",
    description: "Вышло критическое обновление для Windows",
    status: true,
    created: new Date(),
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
          'created': element.created.toLocaleString(),
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
          created: new Date(),
        };

        tickets.push(newTicket);
        ctx.response.body = newTicket;
        
      } catch (error) {
        ctx.response.status = 500;
        ctx.response.body = JSON.stringify({ error: error.message });
      }
      return;
    }

    case "deleteById": {
      let id = params.get("id");
      const ticket = tickets.find(item => item.id == id);
      if (ticket) {
        tickets = tickets.filter((ticket) => ticket.id !== id);
        ctx.response.status = 204;
      } else {
        ctx.response.status = 404;
        ctx.response.body = "Ticket not found";
        return;
      }
      return;
    }

    case "updateById": {
      let id = params.get("id");
      const ticket = tickets.find(item => item.id == id);
      const updateData = ctx.request.query;
      delete updateData.method;
      if (ticket) {
        Object.assign(ticket, updateData);
        ctx.response.body = tickets;
      } else {
        ctx.response.status = 404;
        ctx.response.body = "Ticket not found";
        return;
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
