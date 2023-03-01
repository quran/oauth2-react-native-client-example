import * as React from 'react'
import { Button, Text, View } from 'react-native'
import jwtDecode from "jwt-decode";
import {
  useAuthRequest,
  exchangeCodeAsync,
  revokeAsync,
} from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { clientId, redirectUri, discovery } from './constant'

WebBrowser.maybeCompleteAuthSession()

export default function App() {
  const [authTokens, setAuthTokens] = React.useState(null)
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      scopes: ['openid', 'offline', 'bookmark'],
      redirectUri,
      usePKCE: true,
    },
    discovery
  )

  React.useEffect(() => {
    const exchangeFn = async (exchangeTokenReq) => {
      try {
        const exchangeTokenResponse = await exchangeCodeAsync(
          exchangeTokenReq,
          discovery
        )
        const { idToken } = exchangeTokenResponse;
        const decoded = jwtDecode(idToken);
        setAuthTokens({ ...exchangeTokenResponse, userProfile: decoded });
      } catch (error) {
        console.error(error)
      }
    }
    if (response) {
      if (response.error) {
        Alert.alert(
          'Authentication error',
          response.params.error_description || 'something went wrong'
        )
        return
      }
      if (response.type === 'success') {
        exchangeFn({
          clientId,
          code: response.params.code,
          redirectUri,
          extraParams: {
            code_verifier: request.codeVerifier,
          },
        })
      }
    }
  }, [discovery, request, response])

  const logout = async () => {
    console.log({ authTokens })
    const revokeResponse = await revokeAsync(
      {
        clientId: clientId,
        token: authTokens.refreshToken,
      },
      discovery
    )
    if (revokeResponse) {
      setAuthTokens(null)
    }
  }
  console.log('authTokens: ' + JSON.stringify(authTokens))

  if (authTokens) {
    const { userProfile: { first_name, last_name } } = authTokens
    return <View style={{ paddingTop: 200 }}>
      <Text>Welcome {`${first_name} ${last_name}`}!</Text>
      <Button title="Logout" onPress={() => logout()} />
    </View>
  }

  return (
    <View style={{ paddingTop: 200 }}>
      <Button
        disabled={!request}
        title="Login"
        onPress={() => promptAsync()}
      />
    </View>
  )
}
