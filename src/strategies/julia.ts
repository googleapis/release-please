import {BaseStrategy, BuildUpdatesOptions} from './base';
import {Update} from '../update';
import {Changelog} from '../updaters/changelog';
import {Version} from '../version';
import {
  ProjectToml,
  parseProjectToml,
  JuliaProject,
} from '../updaters/julia/project-toml';

export class Julia extends BaseStrategy {
  private projectToml?: JuliaProject | null;

  protected async buildUpdates(
    options: BuildUpdatesOptions
  ): Promise<Update[]> {
    const updates: Update[] = [];
    const version = options.newVersion;

    if (!this.skipChangelog) {
      updates.push({
        path: this.addPath(this.changelogPath),
        createIfMissing: true,
        updater: new Changelog({
          version,
          changelogEntry: options.changelogEntry,
        }),
      });
    }

    updates.push({
      path: this.addPath('Project.toml'),
      createIfMissing: false,
      updater: new ProjectToml({version}),
    });

    return updates;
  }

  protected initialReleaseVersion(): Version {
    return Version.parse('0.1.0');
  }

  async getDefaultPackageName(): Promise<string | undefined> {
    const project = await this.getProjectToml();
    return project?.name;
  }

  private async getProjectToml(): Promise<JuliaProject | null> {
    if (this.projectToml === undefined) {
      this.projectToml = await this.loadProjectToml();
    }
    return this.projectToml;
  }

  private async loadProjectToml(): Promise<JuliaProject | null> {
    try {
      const content = await this.github.getFileContentsOnBranch(
        this.addPath('Project.toml'),
        this.targetBranch
      );
      return parseProjectToml(content.parsedContent);
    } catch {
      return null;
    }
  }
}
