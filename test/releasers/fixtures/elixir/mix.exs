defmodule MixTestRepo.MixProject do
  use Mix.Project

  def project do
    [
      app: :mix_test_repo,
      version: "0.5.0",
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
