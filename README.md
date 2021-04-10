# dto-mapper

> SImple to use library to map DTO using typescript decorators

[![NPM Version][npm-image]][npm-url]
![Circle CI][circleci-image]
![Codecov][codecov-image]

## Install

This node module is available through [npm](https://www.npmjs.com/package/dto-mapper).

This package is meant to be used inside a [Typescript](https://www.typescriptlang.org/) project as it
leverages [decorators](https://www.typescriptlang.org/docs/handbook/decorators.html#decorators) to work.

```bash
npm i dto-mapper
```

This package has a peer dependency to [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) and will
require it to function properly. It can be installed from npm using the following command:

```bash
npm i reflect-metadata
```

You will need to enable experimental decorators and emitting decorator metadata inside your ```tsconfig.json```:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Usage

### Defining DTOs

```typescript
@dto()
export class UserDto {

    @include()
    id: number;

    @include()
    email: string;
}
```

DTOs must be annotated by @dto() in order to be accepted by the builder function.

Child class inheriting from class annotated by @dto() must also be explicitly decorated by the @dto().

Every field that need to be mapped inside the DTO must be explicitly decorated by @include() or they will be ignored by
default.

### Binding fields

By default fields from the DTO will expect a field with the same name inside the object being serialized. When being
deserialized they will also map to a field with the same name by default.

For example the above DTO will expect an object similar to:

```typescript
const toSerialize = {
    id: 0,
    email: "test@email.org",
};
```

There are various decorators available to customize this behavior:

#### @mapTo

This decorator allows to define the name of the field the property is mapped to.

Example:

```typescript
@dto()
export class UserDto {

    @include()
    id: number;

    @include()
    @mapTo('userEmail')
    email: string;
}
```

This DTO will expect an object similar to:

```typescript
const toSerialize = {
    id: 0,
    userEmail: "test@email.org",
};
```

#### @accessMode

This decorator allows to restrict the access to the property, it accepts a value from the ```AccessMode``` enum:

| Value | Effect |
| ----- | ------ |
| AccessMode.NONE | Property will be ignored. |
| AccessMode.READ | Property will be only serialized but not deserialized. |
| AccessMode.WRITE | Property will be only deserialized but not serialized. |
| AccessMode.ALL (default) | Property will be ignored. |

#### @readOnly

Shortcut for ```@accessMode(AccessMode.READ)```

#### @writeOnly

Shortcut for ```@accessMode(AccessMode.WRITE)```

#### @transform

Allows to modify a property before serializing and deserializing it.

Example:

```typescript
@dto()
export class UserDto {

    @include()
    id: number;

    @include()
    @transform({
        toDto: (name) => name.toUpperCase(),
        fromDto: (name) => name.toLowerCase(),
    })
    name: string;
}
```

In this example the ```name``` property will be serialized in uppercase but will be deserialized in lowercase.

#### @scope

Defines the scopes that can access this property. The scope can be passed to the mapper when serializing or
deserializing.

This can be used to hide fields to user with insufficient permissions

Example:

```typescript
@dto()
export class UserDto {

    @include()
    id: number;

    @include()
    @scope('admin', 'moderator')
    name: string;
}
```

In this example the ```name``` property will only be serialized and deserialized if the ```'admin'``` **OR**
the ```'moderator'``` scope is passed to the mapper.

#### @nested

Allows to map a property to another DTO.

Example:

```typescript
@dto()
export class RoleDto {

    @include()
    name: string;
}

@dto()
export class UserDto {

    @include()
    id: number;

    @include()
    @nested(
        () => RoleDto,
        true /* Set to true if this is an array otherwise false */
    )
    roles: RoleDto[];
}
```

In this example the ```UserDto``` includes an array of ```RoleDto```.

### Creating the mapper

Once your DTO class has been defined you can create a mapper to actually start serializing and deserializing data.

In order to do so you can use the ```buildMapper``` function.

Example:

```typescript
const mapper = buildMapper(UserDto); // Magic !
```

**Important**: this function is expensive and should be called only once per DTO, you should cache the mapper and reuse it.

### Mapping data

Finally, when your mapper is ready you can call the ```serialize``` method to serialize data:

```typescript
// No scope
const serialized = mapper.serialize({ id: 0, userEmail: 'bob@email.org' });

// Admin scope
const serializedWithScope = mapper.serialize({ id: 0, userEmail: 'bob@email.org' }, 'admin');
```

You can deserialize data using the ```deserialize``` method:

```typescript
// No scope
const deserialized = mapper.deserialize({ id: 0, email: 'bob@email.org' });

// Admin scope
const deserializedWithScope = mapper.deserialize({ id: 0, email: 'bob@email.org' }, 'admin');
```

## License

[MIT](http://vjpr.mit-license.org)

[npm-image]: https://img.shields.io/npm/v/dto-mapper.svg

[npm-url]: https://npmjs.org/package/dto-mapper

[circleci-image]: https://img.shields.io/circleci/build/github/Bassintag/dto-mapper/master?token=297ccde7a4878b59607a44917180da16eb1e307a

[codecov-image]: https://img.shields.io/codecov/c/gh/Bassintag/dto-mapper
