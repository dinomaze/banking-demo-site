var shell = require("shelljs");

shell.cp("-R", "public", "dist/public");
shell.cp("-R", "data", "dist/data");
shell.cp("-R", "./src/graphql/schema.graphql", "./dist/graphql/schema.graphql");

