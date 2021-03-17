import {IMapper, IMapperField, ITransformer, ITransformFunction, Mapper} from './mapper';
import {
    DTO_METADATA,
    MAP_TO_METADATA,
    NESTED_METADATA,
    PROPERTIES_METADATA,
    SCOPE_METADATA,
    TRANSFORM_METADATA
} from './const';
import {IScope} from './scope';
import {INestedMetadata} from './annotation';

export interface Class<T> extends Function {
    new(...args: any[]): T;
}


export function buildMapper<EntityT, DtoT>(dtoClass: Class<DtoT>, ignoreNested: boolean = false): IMapper<DtoT, EntityT> {
    if (Reflect.getOwnMetadata(DTO_METADATA, dtoClass) !== true) {
        throw new Error('Missing DTO Decorator on class ' + dtoClass.name);
    }
    const keys = Reflect.getMetadata(PROPERTIES_METADATA, dtoClass) || [];
    const fields: IMapperField<keyof DtoT, keyof EntityT>[] = keys.map((k) => {
        let scopes: IScope[] | undefined = Reflect.getMetadata(SCOPE_METADATA, dtoClass, k) || undefined;
        let to: keyof EntityT = Reflect.getMetadata(MAP_TO_METADATA, dtoClass, k) || k;
        const transformers = Reflect.getMetadata(TRANSFORM_METADATA, dtoClass, k);
        const nested: INestedMetadata = Reflect.getMetadata(NESTED_METADATA, dtoClass, k);
        let transformer: ITransformer<DtoT, EntityT> | undefined;
        if (transformers != null && nested != null) {
            throw new Error('A property cannot have @nested and @transform')
        }
        if (transformers) {
            transformer = combineTransformers<DtoT, EntityT>(transformers);
        } else if (nested && !ignoreNested) {
            const clazz = nested.accessor();
            const builtNested = buildMapper<any, any>(clazz, true);
            transformer = {
                toDto: input => input == null ? null : builtNested.serialize(input),
                fromDto: input => input == null ? null : builtNested.deserialize(input),
            };
        } else {
            transformer = undefined;
        }
        return {
            from: k,
            to,
            scopes,
            transformer,
        };
    });
    return new Mapper<DtoT, EntityT>({fields});
}

export function combineTransformFunction<T = any, U = any>(functions: ITransformFunction<any, any>[]): ITransformFunction<T, U> {
    if (functions.length === 0) {
        return (data: T) => data as any;
    }
    if (functions.length === 1) {
        return functions[0];
    }
    return (input: T): U => {
        let value: any = input;
        for (let func of functions) {
            value = func(value);
        }
        return value;
    }
}

export function combineTransformers<T = any, U = any>(transformers: ITransformer<any, any>[]): ITransformer<T, U> {
    return {
        toDto: combineTransformFunction<U, T>(transformers.map((t) => t.toDto)),
        fromDto: combineTransformFunction<T, U>(transformers.map((t) => t.fromDto)),
    }
}