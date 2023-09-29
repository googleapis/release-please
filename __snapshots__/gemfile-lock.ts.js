exports['Gemfile.lock updateContent does not update anything if gem name is not provided 1'] = `
PATH
  remote: .
  specs:
    foo (0.1.0)

GEM
  remote: https://rubygems.org/
  specs:
    ast (2.4.2)
    foobar (1.0.1)
    diff-lcs (1.5.0)
    json (2.6.3)
    parallel (1.22.1)
    parser (3.1.3.0)
      ast (~> 2.4.1)
    rainbow (3.1.1)
    rake (13.0.6)
    regexp_parser (2.6.1)
    rexml (3.2.5)
    rspec (3.12.0)
      rspec-core (~> 3.12.0)
      rspec-expectations (~> 3.12.0)
      rspec-mocks (~> 3.12.0)
    rspec-core (3.12.0)
      rspec-support (~> 3.12.0)
    rspec-expectations (3.12.0)
      diff-lcs (>= 1.2.0, < 2.0)
      rspec-support (~> 3.12.0)
    rspec-mocks (3.12.0)
      diff-lcs (>= 1.2.0, < 2.0)
      rspec-support (~> 3.12.0)
    rspec-support (3.12.0)
    rubocop (1.39.0)
      json (~> 2.3)
      parallel (~> 1.10)
      parser (>= 3.1.2.1)
      rainbow (>= 2.2.2, < 4.0)
      regexp_parser (>= 1.8, < 3.0)
      rexml (>= 3.2.5, < 4.0)
      rubocop-ast (>= 1.23.0, < 2.0)
      ruby-progressbar (~> 1.7)
      unicode-display_width (>= 1.4.0, < 3.0)
    rubocop-ast (1.24.0)
      parser (>= 3.1.1.0)
    ruby-progressbar (1.11.0)
    unicode-display_width (2.3.0)

PLATFORMS
  ruby

DEPENDENCIES
  bundler
  foo!
  foobar
  rake
  rspec
  rubocop

BUNDLED WITH
   2.3.26

`

exports['Gemfile.lock updateContent updates prerelease in Gemfile.lock 1'] = `
PATH
  remote: .
  specs:
    foo (0.2.0.pre.alpha)

GEM
  remote: https://rubygems.org/
  specs:
    ast (2.4.2)
    foobar (1.0.1)
    diff-lcs (1.5.0)
    json (2.6.3)
    parallel (1.22.1)
    parser (3.1.3.0)
      ast (~> 2.4.1)
    rainbow (3.1.1)
    rake (13.0.6)
    regexp_parser (2.6.1)
    rexml (3.2.5)
    rspec (3.12.0)
      rspec-core (~> 3.12.0)
      rspec-expectations (~> 3.12.0)
      rspec-mocks (~> 3.12.0)
    rspec-core (3.12.0)
      rspec-support (~> 3.12.0)
    rspec-expectations (3.12.0)
      diff-lcs (>= 1.2.0, < 2.0)
      rspec-support (~> 3.12.0)
    rspec-mocks (3.12.0)
      diff-lcs (>= 1.2.0, < 2.0)
      rspec-support (~> 3.12.0)
    rspec-support (3.12.0)
    rubocop (1.39.0)
      json (~> 2.3)
      parallel (~> 1.10)
      parser (>= 3.1.2.1)
      rainbow (>= 2.2.2, < 4.0)
      regexp_parser (>= 1.8, < 3.0)
      rexml (>= 3.2.5, < 4.0)
      rubocop-ast (>= 1.23.0, < 2.0)
      ruby-progressbar (~> 1.7)
      unicode-display_width (>= 1.4.0, < 3.0)
    rubocop-ast (1.24.0)
      parser (>= 3.1.1.0)
    ruby-progressbar (1.11.0)
    unicode-display_width (2.3.0)

PLATFORMS
  ruby

DEPENDENCIES
  bundler
  foo!
  foobar
  rake
  rspec
  rubocop

BUNDLED WITH
   2.3.26

`

exports['Gemfile.lock updateContent updates version in Gemfile.lock 1'] = `
PATH
  remote: .
  specs:
    foo (0.2.0)

GEM
  remote: https://rubygems.org/
  specs:
    ast (2.4.2)
    foobar (1.0.1)
    diff-lcs (1.5.0)
    json (2.6.3)
    parallel (1.22.1)
    parser (3.1.3.0)
      ast (~> 2.4.1)
    rainbow (3.1.1)
    rake (13.0.6)
    regexp_parser (2.6.1)
    rexml (3.2.5)
    rspec (3.12.0)
      rspec-core (~> 3.12.0)
      rspec-expectations (~> 3.12.0)
      rspec-mocks (~> 3.12.0)
    rspec-core (3.12.0)
      rspec-support (~> 3.12.0)
    rspec-expectations (3.12.0)
      diff-lcs (>= 1.2.0, < 2.0)
      rspec-support (~> 3.12.0)
    rspec-mocks (3.12.0)
      diff-lcs (>= 1.2.0, < 2.0)
      rspec-support (~> 3.12.0)
    rspec-support (3.12.0)
    rubocop (1.39.0)
      json (~> 2.3)
      parallel (~> 1.10)
      parser (>= 3.1.2.1)
      rainbow (>= 2.2.2, < 4.0)
      regexp_parser (>= 1.8, < 3.0)
      rexml (>= 3.2.5, < 4.0)
      rubocop-ast (>= 1.23.0, < 2.0)
      ruby-progressbar (~> 1.7)
      unicode-display_width (>= 1.4.0, < 3.0)
    rubocop-ast (1.24.0)
      parser (>= 3.1.1.0)
    ruby-progressbar (1.11.0)
    unicode-display_width (2.3.0)

PLATFORMS
  ruby

DEPENDENCIES
  bundler
  foo!
  foobar
  rake
  rspec
  rubocop

BUNDLED WITH
   2.3.26

`
