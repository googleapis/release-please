module example.com/packages/goE

go 1.23.0

replace (
	example.com/packages/goA => ../goA
)

requires (
	example.com/packages/goA v1.1.1
)
