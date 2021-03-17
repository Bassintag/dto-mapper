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
        };
        const serialized = mapper.serialize(entity);
        expect(serialized.a).to.be.undefined;
        expect(serialized.b).to.be.equal(entity.c);
        expect(serialized.nested).to.be.an('object');
        expect(serialized.nested.c).to.be.equal(entity.nested.c);
        expect((serialized.nested as any).secret).to.be.undefined;
        const serializedAdmin = mapper.serialize(entity, 'admin');
        expect(serializedAdmin.a).to.be.equal(entity.a);
        expect(serializedAdmin.b).to.be.equal(entity.c);
        expect(serializedAdmin.nested).to.be.an('object');
        expect(serializedAdmin.nested.c).to.be.equal(entity.nested.c);
        expect((serializedAdmin.nested as any).secret).to.be.undefined;
    });

    it('should deserialize properly', () => {
        const entity: DtoA = {
            a: 'a',
            b: 'c',
            nested: {
                c: 'nested-c',
            },
        };
        const serialized = mapper.deserialize(entity);
        expect(serialized.a).to.be.undefined;
        expect(serialized.c).to.be.equal(entity.b);
        expect(serialized.nested).to.be.an('object');
        expect(serialized.nested.c).to.be.equal(entity.nested.c);
        expect((serialized.nested as any).secret).to.be.undefined;
        const serializedAdmin = mapper.deserialize(entity, 'admin');
        expect(serializedAdmin.a).to.be.equal(entity.a);
        expect(serializedAdmin.c).to.be.equal(entity.b);
        expect(serializedAdmin.nested).to.be.an('object');
        expect(serializedAdmin.nested.c).to.be.equal(entity.nested.c);
        expect((serializedAdmin.nested as any).secret).to.be.undefined;
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