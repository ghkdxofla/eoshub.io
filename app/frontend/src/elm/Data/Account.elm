module Data.Account exposing (..)

import Json.Decode as JD exposing (Decoder)
import Json.Decode.Pipeline exposing (decode, required, optional)


type alias Account =
    { account_name : String
    , core_liquid_balance : String
    , ram_quota : Int
    , ram_usage : Int
    , net_limit : Resource
    , cpu_limit : Resource
    , total_resources : ResourceInEos
    , self_delegated_bandwidth : Maybe ResourceInEos
    , refund_request : Maybe Refund
    }


type alias ResourceInEos =
    { net_weight : String
    , cpu_weight : String
    , ram_bytes : Maybe Int
    }


type alias Resource =
    { used : Int
    , available : Int
    , max : Int
    }


type alias Refund =
    { owner : String
    , request_time : String
    , net_amount : String
    , cpu_amount : String
    }


accountDecoder : JD.Decoder Account
accountDecoder =
    decode Account
        |> required "account_name" JD.string
        |> optional "core_liquid_balance" JD.string "0 EOS"
        |> required "ram_quota" JD.int
        |> required "ram_usage" JD.int
        |> required "net_limit"
            (decode Resource
                |> required "used" JD.int
                |> required "available" JD.int
                |> required "max" JD.int
            )
        |> required "cpu_limit"
            (decode Resource
                |> required "used" JD.int
                |> required "available" JD.int
                |> required "max" JD.int
            )
        |> required "total_resources"
            (decode ResourceInEos
                |> required "net_weight" JD.string
                |> required "cpu_weight" JD.string
                |> required "ram_bytes" (JD.nullable JD.int)
            )
        |> required "self_delegated_bandwidth"
            (JD.nullable
                (decode ResourceInEos
                    |> required "net_weight" JD.string
                    |> required "cpu_weight" JD.string
                    |> optional "ram_bytes" (JD.nullable JD.int) Nothing
                )
            )
        |> required "refund_request"
            (JD.nullable
                (decode Refund
                    |> required "owner" JD.string
                    |> required "request_time" JD.string
                    |> required "net_amount" JD.string
                    |> required "cpu_amount" JD.string
                )
            )


keyAccountsDecoder : JD.Decoder (List String)
keyAccountsDecoder =
    (JD.field "account_names" (JD.list JD.string))
