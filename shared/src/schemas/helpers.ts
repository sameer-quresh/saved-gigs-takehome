import { Type, type TProperties, type TSchema } from "@sinclair/typebox";
import { TypeCompiler } from "@sinclair/typebox/compiler";
import { Value } from "@sinclair/typebox/value";
import { ValidationError } from "../errors";

export function strictObject<T extends TProperties>(properties: T) {
  return Type.Object(properties, { additionalProperties: false });
}

export function StringEnum<T extends readonly string[]>(values: T) {
  return Type.Union(values.map((value) => Type.Literal(value)));
}

type RequestLike = {
  body?: unknown;
  query?: unknown;
  params?: unknown;
};

type SchemaShape = {
  body?: TSchema;
  query?: TSchema;
  params?: TSchema;
};

export function createSchema<T extends SchemaShape>(shape: T) {
  const compiledParts: Partial<
    Record<keyof T, ReturnType<typeof TypeCompiler.Compile>>
  > = {};

  const validatePart = <K extends keyof T>(
    key: K,
    schema: TSchema,
    data: unknown,
  ): unknown => {
    if (!compiledParts[key]) {
      compiledParts[key] = TypeCompiler.Compile(schema);
    }
    const compiled = compiledParts[key]!;
    const coerced = Value.Convert(schema, data);
    const errors = [...compiled.Errors(coerced)];
    if (errors.length) {
      const message = errors
        .map((error) => `${error.path} ${error.message}`)
        .join("; ");
      throw new ValidationError(`Validation failed: ${message}`);
    }
    return coerced;
  };

  const validate = (req: RequestLike) => {
    const result: Record<string, unknown> = {};
    if (shape.body) {
      result.body = validatePart("body", shape.body, req.body ?? {});
    }
    if (shape.query) {
      result.query = validatePart("query", shape.query, req.query ?? {});
    }
    if (shape.params) {
      result.params = validatePart("params", shape.params, req.params ?? {});
    }
    return result as {
      body: T["body"] extends TSchema ? T["body"]["static"] : undefined;
      query: T["query"] extends TSchema ? T["query"]["static"] : undefined;
      params: T["params"] extends TSchema ? T["params"]["static"] : undefined;
    };
  };

  return { validate };
}
