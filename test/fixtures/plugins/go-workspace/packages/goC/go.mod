module example.com/packages/goC

go 1.23.0

replace (
	example.com/packages/goB => ../goB
)

requires (
	example.com/packages/goB v2.2.2
 	example.net/tracing/tracing v1.0.0
)
