import {buildMapper, dto, IMapperField, include, Mapper, mapTo, nested, scope, transform} from '../src';
import {expect} from 'chai';

describe('buildMapper function', () => {

    @dto()
    class B {

        @include()
        c: string;
    }

    @dto()
    class A {

        @include()
        @scope('admin')
        a: string;

        @include()
        @mapTo('c')
        b: string;

        @include()
        @nested(() => B)
        nested: B;
    }

    let mapper: Mapper<any, any>;
    let aField: IMapperField<any, any>;
    let bField: IMapperField<any, any>;
    let cField: IMapperField<any, any>;

    it('should create a corresponding mapper', () => {
        mapper = buildMapper(A) as Mapper<any, any>;
        expect(mapper.config.fields).to.length(3);
        [aField, bField, cField] = mapper.config.fields;
    });

    it('should create scopes', () => {
        expect(aField.scopes).to.have.length(1);
        expect(aField.scopes).to.include('admin');
    });

    it('should respect mapTo', () => {
        expect(bField.from).to.equal('b');
        expect(bField.to).to.equal('c');
    });

    it('should respect nested', () => {
        expect(cField.transformer).to.be.an('object');
        expect(cField.transformer.toDto).to.be.a('function');
        expect(cField.transformer.fromDto).to.be.a('function');
    });

    it('should throw an error if there is no @dto', (done) => {
        class Wrong {
        }

        try {
            buildMapper(Wrong);
        } catch (e) {
            return done();
        }
        expect.fail('No error thrown');
    });

    it('should throw an error if there is a @dto on superclass but not on own class', (done) => {
        @dto()
        class Super {
        }

        class Wrong {
        }

        try {
            buildMapper(Wrong);
        } catch (e) {
            return done();
        }
        expect.fail('No error thrown');
    });

    it('should throw an error if there is @nested and @transform at the same time', (done) => {
        @dto()
        class Wrong {
            @include()
            @nested(() => Wrong)
            @transform({toDto: () => null, fromDto: () => null})
            nested: Wrong;
        }

        try {
            buildMapper(Wrong);
        } catch (e) {
            return done();
        }
        expect.fail('No error thrown');
    });
});