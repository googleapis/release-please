exports['Elixir updateContent updates inline version in mix.exs file 1'] = `
defmodule MixTestRepo.MixProject do
  use Mix.Project

  def project do
    [
      app: :mix_test_repo,
      version: "0.6.0",
      elixir: "~> 1.12",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    []
  end

  defp deps do
    []
  end
end

`

exports['Elixir updateContent updates module attribute version in mix.exs file 1'] = `
defmodule MixTestRepo.MixProject do
  use Mix.Project

  @version "0.6.0"

  def project do
    [
      app: :mix_test_repo,
      version: @version,
      elixir: "~> 1.12",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    []
  end

  defp deps do
    []
  end
end

`
