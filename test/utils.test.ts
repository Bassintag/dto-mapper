import {
    buildMapper, combineTransformers, combineTransformFunction,
    dto,
    IMapperField,
    include, ITransformer,
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

        @include()
        @transform({
            fromDto: (v) => v.toUpperCase(),
            toDto: (v) => v.toLowerCase(),
        })
        f: string;
    }

    let mapper: Mapper<any, any>;
    let aField: IMapperField;
    let bField: IMapperField;
    let cField: IMapperField;
    let dField: IMapperField;
    let eField: IMapperField;
    let fField: IMapperField;

    it('should create a corresponding mapper', () => {
        mapper = buildMapper(A) as Mapper<any, any>;
        expect(mapper.config.fields).to.length(6);
        [aField, bField, cField, dField, eField, fField] = mapper.config.fields;
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

    it('should respect writeOnly', () => {
        expect(eField.disableDeserialize).to.be.false;
        expect(eField.disableSerialize).to.be.true;
    });

    it('should respect transformers', () => {
        expect(fField.transformer).to.be.an('object');
    });

    it('should work even with no property', () => {
        @dto()
        class Empty {
        }

        buildMapper(Empty);
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


describe('combineTransformFunction function', () => {

    const a = (val: number) => val * 2;
    const b = (val: number) => val + 5;

    it('should combine multiple functions', function () {
        const combined = combineTransformFunction([a, b]);
        expect(combined).to.be.a('function');
        const val = combined(2); // 2 * 2 + 5 = 9
        expect(val).to.equal(9);
    });

    it('should return a function that does not modify the data when given no function', function () {
        const combined = combineTransformFunction([]);
        expect(combined).to.be.a('function');
        const val = combined(2);
        expect(val).to.equal(2);
    });

    it('should return the first function if given only one as argument', function () {
        const combined = combineTransformFunction([a]);
        expect(combined).to.be.a('function');
        expect(combined).to.be.equal(a);
        const val = combined(2);
        expect(val).to.equal(4);
    });
});

describe('combineTransformers function', () => {

    const a: ITransformer<any, any> = {
        toDto: (val) => val * 2,
        fromDto: (val) => val / 2,
    };
    const b: ITransformer<any, any> = {
        toDto: (val) => val + 5,
        fromDto: (val) => val - 5,
    };

    it('should combine multiple transformers', function () {
        const combined = combineTransformers([a, b]);
        expect(combined).to.be.an('object');
        expect(combined).to.have.property('toDto').which.is.a('function');
        expect(combined).to.have.property('fromDto').which.is.a('function');
        const to = combined.toDto(2);
        expect(to).to.equal(9);
        const from = combined.fromDto(9);
        expect(from).to.equal(2);
    });
});
