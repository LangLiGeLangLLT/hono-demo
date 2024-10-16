import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { createNodeWebSocket } from '@hono/node-ws'

const app = new Hono()

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

app.get('/', (c) => {
  return c.html(
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <div id="now-time"></div>
        <script
          dangerouslySetInnerHTML={{
            __html: `
        const ws = new WebSocket('ws://localhost:3000/ws')
        const $nowTime = document.getElementById('now-time')
        ws.onmessage = (event) => {
          $nowTime.textContent = event.data
        }
        `,
          }}
        ></script>
      </body>
    </html>
  )
})

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    let intervalId: NodeJS.Timeout
    return {
      onOpen(event, ws) {
        console.log('Connection opened')
        intervalId = setInterval(() => {
          ws.send(new Date().toString())
        }, 200)
      },
      onMessage(event, ws) {
        console.log(`Message from client: ${event.data}`)
        ws.send('Hello from server!')
      },
      onClose(event, ws) {
        console.log('Connection closed')
        clearInterval(intervalId)
      },
    }
  })
)

const port = 3000
console.log(`Server is running on port ${port}`)

const server = serve({
  fetch: app.fetch,
  port,
})
injectWebSocket(server)
