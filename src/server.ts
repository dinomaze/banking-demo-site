import express from "express";
import path, { join } from "path";
import logger from "morgan";
import passport from "passport";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import paginate from "express-paginate";
import { graphqlHTTP } from "express-graphql";
import { loadSchemaSync } from "@graphql-tools/load";
import { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
import { addResolversToSchema } from "@graphql-tools/schema";

import auth from "./auth";
import userRoutes from "./user-routes";
import contactRoutes from "./contact-routes";
import bankAccountRoutes from "./bankaccount-routes";
import transactionRoutes from "./transaction-routes";
import likeRoutes from "./like-routes";
import commentRoutes from "./comment-routes";
import notificationRoutes from "./notification-routes";
import bankTransferRoutes from "./banktransfer-routes";
import testDataRoutes from "./testdata-routes";
import { checkAuth0Jwt, verifyOktaToken, checkGoogleJwt } from "./helpers";
import resolvers from "./graphql/resolvers";

require("dotenv").config();

var isProduction = process.env.NODE_ENV === 'production';

console.log('PRODUCTION', isProduction);
console.log('PORT', process.env.PORT);
console.log('PUBLIC PATH', isProduction ? path.join(__dirname, 'public') : path.join(__dirname, '..','public'));

const corsOption = {
  // origin: `http://localhost:${frontendPort}`,
  credentials: true,
};

const schema = loadSchemaSync(join(__dirname, "./graphql/schema.graphql"), {
  loaders: [new GraphQLFileLoader()],
});

const schemaWithResolvers = addResolversToSchema({
  schema,
  resolvers,
});

const app = express();

/* istanbul ignore next */
// @ts-ignore
if (global.__coverage__) {
  require("@cypress/code-coverage/middleware/express")(app);
}

app.use(cors(corsOption));
app.use(logger("dev") as any);
app.use(bodyParser.urlencoded({ extended: false }) as any);
app.use(bodyParser.json() as any);

app.use(
  session({
    secret: "session secret",
    resave: false,
    saveUninitialized: false,
    unset: "destroy",
  })
);
app.use(passport.initialize());
app.use(passport.session());

// app.use(paginate.middleware(+process.env.PAGINATION_PAGE_SIZE!));

/* istanbul ignore next */
if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
  app.use("/testData", testDataRoutes);
}

app.use(auth);

/* istanbul ignore if */
if (process.env.REACT_APP_OKTA) {
  app.use(verifyOktaToken);
}

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schemaWithResolvers,
    graphiql: true,
  }) as any
);

app.use("/users", userRoutes);
app.use("/contacts", contactRoutes);
app.use("/bankAccounts", bankAccountRoutes);
app.use("/transactions", transactionRoutes);
app.use("/likes", likeRoutes);
app.use("/comments", commentRoutes);
app.use("/notifications", notificationRoutes);
app.use("/bankTransfers", bankTransferRoutes);

app.use(express.static(isProduction ? path.join(__dirname, 'public') : path.join(__dirname, '..','public')) as any);

app.listen(process.env.PORT);

export default app;