import 'reflect-metadata';

import {
    ACCESS_MODE_METADATA,
    DTO_METADATA,
    MAP_TO_METADATA,
    NESTED_METADATA,
    PROPERTIES_METADATA,
    SCOPE_METADATA,
    TRANSFORM_METADATA
} from './const';
import {IScope} from './scope';
import {ITransformer} from './mapper';
import {Class} from './utils';

/**
 * Used to mark a class as a dto, it is required in order to be able to be mapped by the buildMapper function.
 * It has to annotate the exact class used by buildMapper and is not inherited.
 *
 * @return ClassDecorator
 */
export const dto = (): ClassDecorator => {
    return (target) => {
        Reflect.defineMetadata(DTO_METADATA, true, target);
    };
};

/**
 * Used to mark a field of a dto, fields not decorated by @include will not be included in the mapper
 *
 * @return PropertyDecorator
 */
export const include = (): PropertyDecorator => {
    return (target, propertyKey) => {
        const properties: (string | symbol)[] = Reflect.getMetadata(PROPERTIES_METADATA, target.constructor) || [];
        if (!properties.includes(propertyKey)) {
            Reflect.defineMetadata(PROPERTIES_METADATA, [...properties, propertyKey], target.constructor);
        }
    };
};

/**
 * Used to make a field only usable if a specific scope has been provided to the mapper.
 * Can be used to restrict data depending on permissions, for example admin only properties.
 *
 * @param scopes The scopes that can access this field.
 * @return PropertyDecorator
 */
export const scope = (...scopes: IScope[]): PropertyDecorator => {
    return (target, propertyKey) => {
        const definedScopes: (string | symbol)[] = Reflect.getMetadata(SCOPE_METADATA, target.constructor, propertyKey) || [];
        Reflect.defineMetadata(SCOPE_METADATA, [...definedScopes, ...scopes], target.constructor, propertyKey);
    };
};

/**
 * Used to map the field to a field named differently on the entity class
 *
 * @param to The name of the field it is mapped to on the entity class
 * @return PropertyDecorator
 */
export const mapTo = (to: string): PropertyDecorator => {
    return (target, propertyKey) => {
        Reflect.defineMetadata(MAP_TO_METADATA, to, target.constructor, propertyKey);
    };
};

/**
 * Used to provide a transformer to transform the field when it is serialized / deserialized
 *
 * @example @transform({ toDto: (input: Date) => input.getTime(), fromDto: (input: Date) => new Date(input) })
 *
 *
 * @param transformer The transformer to be used
 * @return PropertyDecorator
 */
export const transform = (transformer: ITransformer<any, any>): PropertyDecorator => {
    return (target, propertyKey) => {
        const definedTransformers: ITransformer<any, any>[] = Reflect.getMetadata(TRANSFORM_METADATA, target.constructor, propertyKey) || [];
        Reflect.defineMetadata(TRANSFORM_METADATA, [...definedTransformers, transformer], target.constructor, propertyKey);
    };
};

export interface INestedMetadata {
    accessor: () => Class<any>;
    many: boolean;
}

/**
 * Used to map this property to another dto
 *
 * @param accessor A function that returns the class to use to map the nested dto, should also be decorated by @dto
 * @param many Whether this field is an array or not
 * @return PropertyDecorator
 */
export const nested = (accessor: () => Class<any>, many = false): PropertyDecorator => {
    return (target, propertyKey) => {
        const meta: INestedMetadata = {
            accessor,
            many,
        };
        Reflect.defineMetadata(NESTED_METADATA, meta, target.constructor, propertyKey);
    };
};

export enum AccessMode {
    NONE = 0,
    READ = 1,
    WRITE = 2,
    ALL = READ | WRITE,
}

/**
 * Used to define the if this property should be serializable / deserializable
 *
 * @param mode The access mode, 0 = None, 1 = Serialize, 2 = Deserialize, 3 = Both
 * @return PropertyDecorator
 */
export const accessMode = (mode: AccessMode): PropertyDecorator => {
    return (target, propertyKey) => {
        Reflect.defineMetadata(ACCESS_MODE_METADATA, mode, target.constructor, propertyKey);
    };
};

/**
 * Used to make this property serialize only
 *
 * @return PropertyDecorator
 */
export const readOnly = (): PropertyDecorator => {
    return (target, propertyKey) => {
        Reflect.defineMetadata(ACCESS_MODE_METADATA, AccessMode.READ, target.constructor, propertyKey);
    };
};

/**
 * Used to make this property deserialize only
 *
 * @return PropertyDecorator
 */
export const writeOnly = (): PropertyDecorator => {
    return (target, propertyKey) => {
        Reflect.defineMetadata(ACCESS_MODE_METADATA, AccessMode.WRITE, target.constructor, propertyKey);
    };
};
