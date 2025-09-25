interface Props {
  htmlFor: string
  children: React.ReactNode
}

const SignupLabel = ({htmlFor, children}:Props) => (
  <label
    htmlFor={htmlFor}
    className="text-white text-sm font-medium"
  >
    {children}
  </label>
)

export default SignupLabel
