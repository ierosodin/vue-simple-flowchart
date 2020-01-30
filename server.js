// optional: allow environment to specify port
const port = process.env.PORT || 8080;

// wire up the module
const express = require('express');
const compression = require('compression');
// create server instance
const app = express();
app.use(express.static('demo'));

function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    return false;
  }
  return compression.filter(req, res);
}

app.use(compression({
  filter: shouldCompress,
}));
// start the server
app.listen(port, () => console.log(`Listening on port ${port}`));
