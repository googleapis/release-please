module example.com/packages/goB

go 1.23.0

replace (
	example.com/packages/goA => ../goA
)

requires (
	example.com/packages/goA v1.1.1
 	example.net/tracing/tracing v1.0.0
)
