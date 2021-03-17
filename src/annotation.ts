import 'reflect-metadata';

import {
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

export const dto = (): ClassDecorator => {
    return (target) => {
        Reflect.defineMetadata(DTO_METADATA, true, target);
    };
}

export const include = (): PropertyDecorator => {
    return (target, propertyKey) => {
        const properties: (string | symbol)[] = Reflect.getMetadata(PROPERTIES_METADATA, target.constructor) || [];
        if (!properties.includes(propertyKey)) {
            Reflect.defineMetadata(PROPERTIES_METADATA, [...properties, propertyKey], target.constructor);
        }
    };
}

export const scope = (...scopes: IScope[]): PropertyDecorator => {
    return (target, propertyKey) => {
        const definedScopes: (string | symbol)[] = Reflect.getMetadata(SCOPE_METADATA, target.constructor, propertyKey) || [];
        Reflect.defineMetadata(SCOPE_METADATA, [...definedScopes, ...scopes], target.constructor, propertyKey);
    };
}

export const mapTo = (to: string): PropertyDecorator => {
    return (target, propertyKey) => {
        Reflect.defineMetadata(MAP_TO_METADATA, to, target.constructor, propertyKey);
    };
}

export const transform = (transformer: ITransformer<any, any>): PropertyDecorator => {
    return (target, propertyKey) => {
        const definedTransformers: ITransformer<any, any>[] = Reflect.getMetadata(TRANSFORM_METADATA, target.constructor, propertyKey) || [];
        Reflect.defineMetadata(TRANSFORM_METADATA, [...definedTransformers, transformer], target.constructor, propertyKey);
    };
}

export interface INestedMetadata {
    accessor: () => Class<any>;
    many: boolean;
}

export const nested = (accessor: () => Class<any>, many = false): PropertyDecorator => {
    return (target, propertyKey) => {
        const meta: INestedMetadata = {
            accessor,
            many,
        };
        Reflect.defineMetadata(NESTED_METADATA, meta, target.constructor, propertyKey);
    };
}