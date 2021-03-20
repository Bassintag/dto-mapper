import 'reflect-metadata';

import {expect} from 'chai';
import {AccessMode, accessMode, dto, include, mapTo, nested, readOnly, scope, transform, writeOnly} from '../src';
import {
    ACCESS_MODE_METADATA,
    DTO_METADATA,
    MAP_TO_METADATA,
    NESTED_METADATA,
    PROPERTIES_METADATA,
    SCOPE_METADATA,
    TRANSFORM_METADATA
} from '../src/const';

describe('@dto annotation', () => {

    it('should define the dto metadata', () => {
        @dto()
        class SampleDtoClass {
        }

        const metadata = Reflect.getOwnMetadata(DTO_METADATA, SampleDtoClass);

        expect(metadata).to.be.true;
    });
});

describe('@include annotation', () => {

    it('should define the properties metadata', () => {
        class SampleDtoClass {
            @include()
            a: any;
        }

        const metadata = Reflect.getMetadata(PROPERTIES_METADATA, SampleDtoClass);

        expect(metadata)
            .to.be.an('array')
            .of.length(1)
            .and.to.include('a');
    });

    it('should add to the existing metadata if it already has been defined', () => {
        class SampleDtoClass {
            @include()
            a: any;

            @include()
            b: any;
        }

        const metadata = Reflect.getMetadata(PROPERTIES_METADATA, SampleDtoClass);

        expect(metadata)
            .to.be.an('array')
            .of.length(2)
            .to.include('a')
            .and.to.include('b');
    });
});

describe('@scope annotation', () => {

    it('should define the scope metadata', () => {
        class SampleDtoClass {
            @scope('scope-1', 'scope-2')
            a: any;
        }

        const metadata = Reflect.getMetadata(SCOPE_METADATA, SampleDtoClass, 'a');

        expect(metadata)
            .to.be.an('array')
            .of.length(2)
            .to.include('scope-1')
            .and.to.include('scope-2');
    });
});

describe('@mapTo annotation', () => {

    it('should define the mapTo metadata', () => {
        class SampleDtoClass {
            @mapTo('b')
            a: any;
        }

        const metadata = Reflect.getMetadata(MAP_TO_METADATA, SampleDtoClass, 'a');

        expect(metadata).to.equal('b');
    });
});

describe('@transform annotation', () => {

    it('should define the transformers metadata', () => {
        class SampleDtoClass {
            @transform({
                toDto: () => 1,
                fromDto: () => 2,
            })
            a: any;
        }

        const metadata = Reflect.getMetadata(TRANSFORM_METADATA, SampleDtoClass, 'a');

        expect(metadata).to.be.an('array')
            .and.to.have.lengthOf(1);

        const transformer = metadata[0];

        expect(transformer).to.be.an('object');
        expect(transformer).to.have.property('toDto').that.is.a('function');
        expect(transformer).to.have.property('fromDto').that.is.a('function');
    });

    it('should add to the existing metadata if it already has been defined', () => {
        class SampleDtoClass {
            @transform({
                toDto: () => 1,
                fromDto: () => 2,
            })
            @transform({
                toDto: () => 3,
                fromDto: () => 4,
            })
            a: any;
        }

        const metadata = Reflect.getMetadata(TRANSFORM_METADATA, SampleDtoClass, 'a');

        expect(metadata).to.be.an('array')
            .and.to.have.lengthOf(2);
    });
});

describe('@nested annotation', () => {

    it('should define the nested metadata', () => {
        class SampleDtoClass {
            @nested(() => SampleDtoClass)
            a: any;
        }

        const metadata = Reflect.getMetadata(NESTED_METADATA, SampleDtoClass, 'a');

        expect(metadata).to.be.an('object');
        expect(metadata.accessor).to.be.a('function');
        expect(metadata.many).to.be.false;
    });
});

describe('@accessMode annotation', () => {

    it('should define the access mode metadata', () => {
        class SampleDtoClass {
            @accessMode(AccessMode.WRITE)
            a: any;
        }

        const metadata = Reflect.getMetadata(ACCESS_MODE_METADATA, SampleDtoClass, 'a');
        expect(metadata).to.be.equal(AccessMode.WRITE);
    });
});

describe('@readOnly annotation', () => {

    it('should define the access mode metadata', () => {
        class SampleDtoClass {
            @readOnly()
            a: any;
        }

        const metadata = Reflect.getMetadata(ACCESS_MODE_METADATA, SampleDtoClass, 'a');
        expect(metadata).to.be.equal(AccessMode.READ);
    });
});

describe('@writeOnly annotation', () => {

    it('should define the access mode metadata', () => {
        class SampleDtoClass {
            @writeOnly()
            a: any;
        }

        const metadata = Reflect.getMetadata(ACCESS_MODE_METADATA, SampleDtoClass, 'a');
        expect(metadata).to.be.equal(AccessMode.WRITE);
    });
});
