import {IScope} from './scope';
import {Class} from './utils';

export interface IResolvedFieldValue<T, ClassT> {
    key: keyof ClassT;

    value: T;
}

export interface IMapper<DtoT, EntityT> {

    deserialize(input: DtoT, scope?: IScope): EntityT;

    serialize(input: EntityT, scope?: IScope): DtoT;

    deserializeField<KeyT extends keyof DtoT>(key: KeyT, input: DtoT[KeyT], scope?: IScope): IResolvedFieldValue<DtoT[KeyT], EntityT>;

    serializeField<KeyT extends keyof EntityT>(key: KeyT, input: EntityT[KeyT], scope?: IScope): IResolvedFieldValue<EntityT[KeyT], DtoT>;
}

export type ITransformFunction<InT, OutT> = (input: InT) => OutT;

export interface ITransformer<DtoFieldT, EntityFieldT> {

    readonly fromDto: ITransformFunction<DtoFieldT, EntityFieldT>;

    readonly toDto: ITransformFunction<EntityFieldT, DtoFieldT>;
}

export interface IMapperField<DtoKeyT extends keyof DtoT, EntityKeyT extends keyof EntityT, DtoT = any, EntityT = any> {

    readonly from: DtoKeyT;

    readonly to: EntityKeyT;

    readonly scopes?: readonly IScope[];

    readonly transformer?: ITransformer<DtoT[DtoKeyT], EntityT[EntityKeyT]>;
}

export interface IMapperConfig<DtoT, EntityT> {

    readonly dtoConstructor?: Class<DtoT>;

    readonly entityConstructor?: Class<EntityT>;

    readonly fields: IMapperField<keyof DtoT, keyof EntityT, DtoT, EntityT>[];
}

type IFieldMap<DtoT, EntityT> = { readonly [KeyT in keyof DtoT]?: IMapperField<KeyT, keyof EntityT, DtoT, EntityT> };
type IReverseFieldMap<DtoT, EntityT> = { readonly [KeyT in keyof EntityT]?: IMapperField<keyof DtoT, KeyT, DtoT, EntityT> };

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

    deserialize(input: DtoT, scope?: IScope): EntityT {
        let inflating: Partial<EntityT>;
        if (this.config.entityConstructor) {
            inflating = new this.config.entityConstructor();
        } else {
            inflating = {};
        }
        for (const field of this.config.fields) {
            if (field.scopes == null || field.scopes.includes(scope)) {
                const value = input[field.from];
                if (field.transformer != null) {
                    inflating[field.to] = field.transformer.fromDto(value);
                } else {
                    inflating[field.to] = value as any;
                }
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
            if (field.scopes == null || field.scopes.includes(scope)) {
                const value = input[field.to];
                if (field.transformer != null) {
                    inflating[field.from] = field.transformer.toDto(value);
                } else {
                    inflating[field.from] = value as any;
                }
            }
        }
        return inflating as DtoT;
    }

    deserializeField<KeyT extends keyof DtoT>(key: KeyT, input: DtoT[KeyT], scope?: IScope): IResolvedFieldValue<DtoT[KeyT], EntityT> {
        const field = this.fieldMap[key];
        let value: any;
        if (field.transformer != null) {
            value = field.transformer.fromDto(input);
        } else {
            value = input;
        }
        return {
            key: field.to,
            value,
        };
    }

    serializeField<T, KeyT extends keyof EntityT>(key: KeyT, input: EntityT[KeyT], scope?: IScope): IResolvedFieldValue<EntityT[KeyT], DtoT> {
        const field = this.reverseFieldMap[key];
        let value: any;
        if (field.transformer != null) {
            value = field.transformer.toDto(input);
        } else {
            value = input;
        }
        return {
            key: field.from,
            value,
        };
    }


}