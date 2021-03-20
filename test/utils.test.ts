import {
    buildMapper,
    dto,
    IMapperField,
    include,
    Mapper,
    mapTo,
    nested,
    readOnly,
    scope,
    transform,
    writeOnly
} from '../src';
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

        @include()
        @readOnly()
        d: string;

        @include()
        @writeOnly()
        e: string;
    }

    let mapper: Mapper<any, any>;
    let aField: IMapperField;
    let bField: IMapperField;
    let cField: IMapperField;
    let dField: IMapperField;
    let eField: IMapperField;

    it('should create a corresponding mapper', () => {
        mapper = buildMapper(A) as Mapper<any, any>;
        expect(mapper.config.fields).to.length(5);
        [aField, bField, cField, dField, eField] = mapper.config.fields;
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

    it('should respect readOnly', () => {
        expect(dField.disableDeserialize).to.be.true;
        expect(dField.disableSerialize).to.be.false;
    });

    it('should respect writeOnly', () => {
        expect(eField.disableDeserialize).to.be.false;
        expect(eField.disableSerialize).to.be.true;
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
