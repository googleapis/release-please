exports['go.mod updateContent updates a commit dependency 1'] = `
module example.com/hello/world

go 1.23.0

replace example.com/foo/bar/v2 => ../../foo/bar

require (
\texample.com/foo/bar/v2 v2.1.0
\texample.com/foo/baz v1.2.3
\texample.com/car/dar v0.1.2 // indirect
)

`

exports['go.mod updateContent updates dependencies 1'] = `
module example.com/hello/world

go 1.23.0

replace example.com/foo/bar/v2 => ../../foo/bar

require (
\texample.com/foo/bar/v2 v2.1.3
\texample.com/foo/baz v1.2.3
\texample.com/car/dar v0.1.1-0.20250203122516-4c838e530ecb // indirect
)

`
