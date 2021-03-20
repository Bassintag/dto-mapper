import {IScope} from './scope';
import {Class} from './utils';

export interface IResolvedFieldValue<ClassT> {
    key: keyof ClassT;

    value: ClassT[keyof ClassT];
}

export interface IMapper<DtoT, EntityT> {

    deserialize(input: DtoT, scope?: IScope): EntityT;

    serialize(input: EntityT, scope?: IScope): DtoT;

    deserializeAndMapField<KeyT extends keyof DtoT>(key: KeyT, input: DtoT[KeyT], scope?: IScope): IResolvedFieldValue<EntityT> | undefined;

    serializeAndUnmapField<KeyT extends keyof EntityT>(key: KeyT, input: EntityT[KeyT], scope?: IScope): IResolvedFieldValue<DtoT> | undefined;

    deserializeField<KeyT extends keyof DtoT>(key: KeyT, input: DtoT[KeyT], scope?: IScope): EntityT[keyof EntityT] | undefined;

    serializeField<KeyT extends keyof EntityT>(key: KeyT, input: EntityT[KeyT], scope?: IScope): DtoT[keyof DtoT] | undefined;

    mapKey<KeyT extends keyof DtoT>(key: KeyT, scope?: IScope): keyof EntityT | undefined;

    unmapKey<KeyT extends keyof EntityT>(key: KeyT, scope?: IScope): keyof DtoT | undefined;
}

export type ITransformFunction<InT, OutT> = (input: InT, scope?: IScope) => OutT;

export interface ITransformer<DtoFieldT, EntityFieldT> {

    readonly fromDto: ITransformFunction<DtoFieldT, EntityFieldT>;

    readonly toDto: ITransformFunction<EntityFieldT, DtoFieldT>;
}

export interface IMapperField<DtoKeyT extends keyof DtoT = any, EntityKeyT extends keyof EntityT = any, DtoT = any, EntityT = any> {

    readonly from: DtoKeyT;

    readonly to: EntityKeyT;

    readonly scopes?: readonly IScope[];

    readonly disableSerialize?: boolean;

    readonly disableDeserialize?: boolean;

    readonly transformer?: ITransformer<DtoT[DtoKeyT], EntityT[EntityKeyT]>;
}

export interface IMapperConfig<DtoT, EntityT> {

    readonly dtoConstructor?: Class<DtoT>;

    readonly entityConstructor?: Class<EntityT>;

    readonly fields: IMapperField<keyof DtoT, keyof EntityT, DtoT, EntityT>[];
}

type IFieldMap<DtoT, EntityT> = { readonly [KeyT in keyof DtoT]?: IMapperField<KeyT, keyof EntityT, DtoT, EntityT> };
type IReverseFieldMap<DtoT, EntityT> = { readonly [KeyT in keyof EntityT]?: IMapperField<keyof DtoT, KeyT, DtoT, EntityT> };


const hasScope = (field: IMapperField, scope: IScope | null): boolean => {
    return field.scopes == null || (scope != null && field.scopes.includes(scope));
};

const canDeserialize = (field: IMapperField, scope: IScope): boolean => {
    return field != null && !field.disableDeserialize && hasScope(field, scope);
};

const canSerialize = (field: IMapperField, scope: IScope): boolean => {
    return field != null && !field.disableSerialize && hasScope(field, scope);
};


export class Mapper<DtoT, EntityT> implements IMapper<DtoT, EntityT> {

    readonly fieldMap: IFieldMap<DtoT, EntityT>;
    readonly reverseFieldMap: IReverseFieldMap<DtoT, EntityT>;

    constructor(
        readonly config: IMapperConfig<DtoT, EntityT>
    ) {
        this.fieldMap = config.fields.reduce<IFieldMap<DtoT, EntityT>>((p, v) => ({
            ...p,
            [v.from]: v,
        }), {});
        this.reverseFieldMap = config.fields.reduce<IReverseFieldMap<DtoT, EntityT>>((p, v) => ({
            ...p,
            [v.to]: v,
        }), {});
    }

    private deserializeFieldInternal<T extends keyof DtoT>(field: IMapperField<T, keyof EntityT, DtoT, EntityT>, value: DtoT[T], scope: IScope): any {
        if (field.transformer != null) {
            return field.transformer.fromDto(value, scope);
        } else {
            return value as any;
        }
    }

    private serializeFieldInternal<T extends keyof EntityT>(field: IMapperField<keyof DtoT, T, DtoT, EntityT>, value: EntityT[T], scope: IScope): any {
        if (field.transformer != null) {
            return field.transformer.toDto(value, scope);
        } else {
            return value as any;
        }
    }

    deserialize(input: DtoT, scope?: IScope): EntityT {
        let inflating: Partial<EntityT>;
        if (this.config.entityConstructor) {
            inflating = new this.config.entityConstructor();
        } else {
            inflating = {};
        }
        for (const field of this.config.fields) {
            if (canDeserialize(field, scope)) {
                const value = input[field.from];
                inflating[field.to] = this.deserializeFieldInternal(field, value, scope);
            }
        }
        return inflating as EntityT;
    }

    serialize(input: EntityT, scope?: IScope): DtoT {
        let inflating: Partial<DtoT>;
        if (this.config.dtoConstructor) {
            inflating = new this.config.dtoConstructor();
        } else {
            inflating = {};
        }
        for (const field of this.config.fields) {
            if (canSerialize(field, scope)) {
                const value = input[field.to];
                inflating[field.from] = this.serializeFieldInternal(field, value, scope);
            }
        }
        return inflating as DtoT;
    }

    deserializeField<KeyT extends keyof DtoT>(key: KeyT, input: DtoT[KeyT], scope?: IScope): EntityT[keyof EntityT] | undefined {
        const field = this.fieldMap[key];
        if (!canDeserialize(field, scope)) {
            return undefined;
        }
        return this.deserializeFieldInternal(field, input, scope);
    }

    serializeField<T, KeyT extends keyof EntityT>(key: KeyT, input: EntityT[KeyT], scope?: IScope): DtoT[keyof DtoT] | undefined {
        const field = this.reverseFieldMap[key];
        if (!canSerialize(field, scope)) {
            return undefined;
        }
        return this.serializeFieldInternal(field, input, scope);
    }

    mapKey<KeyT extends keyof DtoT>(key: KeyT, scope?: IScope): keyof EntityT | undefined {
        const field = this.fieldMap[key];
        if (!canDeserialize(field, scope)) {
            return undefined;
        }
        return field.to;
    }

    unmapKey<KeyT extends keyof EntityT>(key: KeyT, scope?: IScope): keyof DtoT | undefined {
        const field = this.reverseFieldMap[key];
        if (!canSerialize(field, scope)) {
            return undefined;
        }
        return field.from;
    }

    deserializeAndMapField<KeyT extends keyof DtoT>(key: KeyT, input: DtoT[KeyT], scope?: IScope): IResolvedFieldValue<EntityT> | undefined {
        const field = this.fieldMap[key];
        if (!canDeserialize(field, scope)) {
            return undefined;
        }
        const value = this.deserializeFieldInternal(field, input, scope);
        return {
            key: field.to,
            value,
        };
    }

    serializeAndUnmapField<KeyT extends keyof EntityT>(key: KeyT, input: EntityT[KeyT], scope?: IScope): IResolvedFieldValue<DtoT> | undefined {
        const field = this.reverseFieldMap[key];
        if (!canSerialize(field, scope)) {
            return undefined;
        }
        const value = this.serializeFieldInternal(field, input, scope);
        return {
            key: field.from,
            value,
        };
    }


}
