module example.com/apps/app-a

go 1.23.0

require (
	example.com/libs/lib-a v0.0.0
)

replace example.com/libs/lib-a => ../../lib-a
