module example.com/apps/app-b

go 1.23.0

require (
	example.com/libs/lib-b v0.0.0
)

replace example.com/libs/lib-b => ../../lib-b
