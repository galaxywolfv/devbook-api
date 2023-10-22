const http = require('http');
const app = require('./app');
http.createServer(app);

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});