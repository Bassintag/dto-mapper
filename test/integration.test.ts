import {expect} from 'chai';
import {buildMapper, dto, IMapper, include, mapTo, nested, scope} from '../src';

describe('basic integration tests', () => {

    interface IEntityB {
        c: string;
        secret: string;
    }

    interface IEntityA {
        a: string
        c: string;
        nested: IEntityB;
        nestedMany: IEntityB[];
    }

    @dto()
    class DtoB {

        @include()
        c: string;
    }

    @dto()
    class DtoA {

        @include()
        @scope('admin')
        a: string;

        @include()
        @mapTo('c')
        b: string;

        @include()
        @nested(() => DtoB)
        nested: DtoB;

        @include()
        @nested(() => DtoB, true)
        nestedMany: DtoB[];
    }

    let mapper: IMapper<DtoA, IEntityA>;

    it('should build the mapper', () => {
        mapper = buildMapper(DtoA);
    });

    it('should serialize properly', () => {
        const entity: IEntityA = {
            a: 'a',
            c: 'c',
            nested: {
                c: 'nested-c',
                secret: 'secret',
            },
            nestedMany: [{
                c: 'nested-many-c',
                secret: 'secret',
            }]
        };
        const serialized = mapper.serialize(entity);
        expect(serialized.a).to.be.undefined;
        expect(serialized.b).to.be.equal(entity.c);
        expect(serialized.nested).to.be.an('object');
        expect(serialized.nested.c).to.be.equal(entity.nested.c);
        expect((serialized.nested as any).secret).to.be.undefined;
        expect(serialized.nestedMany).to.be.an('array').of.length(1);
        expect(serialized.nestedMany[0].c).to.be.equal(entity.nestedMany[0].c);
        expect((serialized.nestedMany[0] as any).secret).to.be.undefined;
        const serializedAdmin = mapper.serialize(entity, 'admin');
        expect(serializedAdmin.a).to.be.equal(entity.a);
    });

    it('should deserialize properly', () => {
        const dto: DtoA = {
            a: 'a',
            b: 'c',
            nested: {
                c: 'nested-c',
            },
            nestedMany: [{
                c: 'nested-many-c',
            }],
        };
        const deserialized = mapper.deserialize(dto);
        expect(deserialized.a).to.be.undefined;
        expect(deserialized.c).to.be.equal(dto.b);
        expect(deserialized.nested).to.be.an('object');
        expect(deserialized.nested.c).to.be.equal(dto.nested.c);
        expect((deserialized.nested as any).secret).to.be.undefined;
        expect(deserialized.nestedMany).to.be.an('array').of.length(1);
        expect(deserialized.nestedMany[0].c).to.be.equal(dto.nestedMany[0].c);
        expect((deserialized.nestedMany[0] as any).secret).to.be.undefined;
        const serializedAdmin = mapper.deserialize(dto, 'admin');
        expect(serializedAdmin.a).to.be.equal(dto.a);
    });
});


describe('inheritance integration tests', () => {

    interface IResource {
        id: string;
    }

    interface IUser extends IResource {
        email: string;
        tag: string;
    }

    @dto()
    class Resource {
        @include()
        id: string;

        @include()
        meta?: string;
    }

    @dto()
    class User extends Resource {
        @include()
        email: string;

        @include()
        @mapTo('tag')
        meta: string;
    }

    let resourceMapper: IMapper<Resource, IResource>;
    let userMapper: IMapper<User, IUser>;

    it('should build the mapper', () => {
        resourceMapper = buildMapper(Resource);
        userMapper = buildMapper(User);
    });

    it('should serialize properly', () => {
        const user: IUser = {
            id: 'id',
            email: 'email',
            tag: 'tag',
        };
        const serializedResource = resourceMapper.serialize(user);
        const serializedUser = userMapper.serialize(user);

        expect(serializedResource.id).to.be.equal('id');
        expect((serializedResource as any).email).to.be.undefined;
        expect(serializedResource.meta).to.be.undefined;

        expect(serializedUser.id).to.be.equal('id');
        expect(serializedUser.email).to.be.equal('email');
        expect(serializedUser.meta).to.be.equal('tag');
    });
});
