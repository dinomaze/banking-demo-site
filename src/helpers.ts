import dotenv from "dotenv";
import { set } from "lodash";
import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import jwt from "express-jwt";
import jwksRsa from "jwks-rsa";

dotenv.config();

const auth0JwtConfig = {
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  audience: process.env.REACT_APP_AUTH0_AUDIENCE,
  issuer: `https://${process.env.REACT_APP_AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
};

const googleJwtConfig = {
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
  }),

  // Validate the audience and the issuer.
  audience: process.env.REACT_APP_GOOGLE_CLIENTID,
  issuer: "accounts.google.com",
  algorithms: ["RS256"],
};

/* istanbul ignore next */
export const verifyOktaToken = (req: Request, res: Response, next: NextFunction) => {
  const bearerHeader = req.headers["authorization"];

  if (bearerHeader) {
    const bearer = bearerHeader.split(" ");
    const bearerToken = bearer[1];
  } else {
    res.status(401).send({
      error: "Unauthorized",
    });
  }
};

export const checkAuth0Jwt = jwt(auth0JwtConfig).unless({ path: ["/testData/*"] });
export const checkGoogleJwt = jwt(googleJwtConfig).unless({ path: ["/testData/*"] });

export const ensureAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    // @ts-ignore
    // Map sub to id on req.user
    if (req.user?.sub) {
      /* istanbul ignore next */
      // @ts-ignore
      set(req.user, "id", req.user.sub);
    }
    return next();
  }
  /* istanbul ignore next */
  res.status(401).send({
    error: "Unauthorized",
  });
};

export const validateMiddleware = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map((validation: any) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(422).json({ errors: errors.array() });
  };
};
