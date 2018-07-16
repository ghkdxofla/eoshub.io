module Route exposing (Route(..), matchRoute, parseLocation)

import Navigation exposing (Location)
import UrlParser exposing ((</>), Parser, map, oneOf, parsePath, s, string, top)


type Route
    = IndexRoute
    | SendEmailRoute
    | EmailConfirmedRoute String
    | EmailConfirmFailureRoute
    | CreateKeysRoute
    | CreatedRoute
    | NameAccountRoute String String
    | SearchRoute
    | VotingRoute
    | TransferRoute
    | NotFoundRoute


matchRoute : Parser (Route -> a) a
matchRoute =
    oneOf
        [ map IndexRoute top
        , map SendEmailRoute (s "account_create" </> s "send_email")
        , map EmailConfirmedRoute (s "account_create" </> s "email_confirmed" </> string)
        , map EmailConfirmFailureRoute (s "account_create" </> s "email_confirm_failure")
        , map CreateKeysRoute (s "account_create" </> s "create_keys")
        , map CreatedRoute (s "account_create" </> s "created")
        , map NameAccountRoute (s "account_create" </> s "name_account" </> string </> string)
        , map SearchRoute (s "search")
        , map VotingRoute (s "voting")
        , map TransferRoute (s "transfer")
        ]


parseLocation : Location -> Route
parseLocation location =
    case parsePath matchRoute location of
        Just route ->
            route

        Nothing ->
            NotFoundRoute
