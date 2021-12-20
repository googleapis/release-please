// Copyright 2021 Google LLC
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

// Generic
import {Changelog} from '../updaters/changelog';
// mix.exs support
import {ElixirMixExs} from '../updaters/elixir/elixir-mix-exs';
import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';

export class Elixir extends BaseStrategy {
  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    updates.push({
      path: this.addPath(this.changelogPath),
      createIfMissing: true,
      updater: new Changelog({
        version,
        changelogEntry: options.changelogEntry,
      }),
    });

    updates.push({
      path: this.addPath('mix.exs'),
      createIfMissing: false,
      updater: new ElixirMixExs({
        version,
      }),
    });

    return updates;
  }
}
