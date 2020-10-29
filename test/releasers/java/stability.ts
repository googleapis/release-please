// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it} from 'mocha';
import {expect} from 'chai';
import {isStableArtifact} from '../../../src/releasers/java/stability';

describe('isStableArtifact', () => {
  it('should return true for a bom artifact', () => {
    const isStable = isStableArtifact('google-cloud-vision-bom');
    expect(isStable).to.be.true;
  });
  it('should return true for a cloud artifact', () => {
    const isStable = isStableArtifact('google-cloud-vision');
    expect(isStable).to.be.true;
  });
  it('should return true for a stable grpc artifact', () => {
    const isStable = isStableArtifact('grpc-google-cloud-vision-v1');
    expect(isStable).to.be.true;
  });
  it('should return false for a beta grpc artifact', () => {
    const isStable = isStableArtifact('grpc-google-cloud-vision-v1beta');
    expect(isStable).to.be.false;
  });
  it('should be true for a stable proto artifact', () => {
    const isStable = isStableArtifact('proto-google-cloud-vision-v3');
    expect(isStable).to.be.true;
  });
  it('should be false for a beta proto artifact', () => {
    const isStable = isStableArtifact('proto-google-cloud-vision-v3beta1');
    expect(isStable).to.be.false;
  });
  it('should ignore versions in the middle', () => {
    const isStable = isStableArtifact('proto-google-cloud-v4foo-v3');
    expect(isStable).to.be.true;
  });
});
