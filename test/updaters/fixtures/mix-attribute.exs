defmodule MixTestRepo.MixProject do
  use Mix.Project

  @version "0.5.0"

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
