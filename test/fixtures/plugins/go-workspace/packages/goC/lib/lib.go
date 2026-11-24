package lib

import libB "example.com/packages/goB/v2/lib"

func FuncC() string {
	return "FuncC"
}

type StructC struct {
	FieldC libB.StructB
}
